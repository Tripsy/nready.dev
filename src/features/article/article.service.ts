import {
	type DeepPartial,
	type EntityManager,
	QueryFailedError,
} from 'typeorm';
import dataSource from '@/config/data-source.config';
import { eventEmitter } from '@/config/event.config';
import { lang } from '@/config/message.setup';
import { CustomError } from '@/exceptions';
import ArticleEntity, {
	type ArticleStatus,
	ArticleVisibilityEnum,
	STATUS_TRANSITIONS,
} from '@/features/article/article.entity';
import { getArticleRepository } from '@/features/article/article.repository';
import type {
	ArticleValidator,
	ArticleVisibilityRuleType,
} from '@/features/article/article.validator';
import type { ArticleAccessTarget } from '@/features/article/article-access.policy';
import ArticleCategoryRepository from '@/features/article/article-category.repository';
import {
	type ArticleAuthorType,
	SLUG_UNIQUE_INDEX,
} from '@/features/article/article-content.entity';
import ArticleContentRepository from '@/features/article/article-content.repository';
import ArticleTagRepository from '@/features/article/article-tag.repository';
import ArticleVisibilityRuleEntity from '@/features/article/article-visibility-rule.entity';
import CategoryEntity from '@/features/category/category.entity';
import { pickValuesFromObject } from '@/helpers/objects.helper';
import { encryptPassword } from '@/helpers/security.helper';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';
import {
	assertValidStatusTransition,
	cleanEntityCache,
} from '@/shared/abstracts/service.abstract';
import { LogHistoryActionEnum } from '@/shared/types/log-history.type';
import type { ValidatorOutput } from '@/shared/types/mock.type';

/**
 * Columns owned by the article row itself — the rest live in child tables
 * (`article_content`, `article_category`, `article_tag`, `article_visibility_rule`).
 */
const entryColumns: string[] = [
	'layout',
	'publish_at',
	'archive_at',
	'featured_status',
	'featured_order',
	'visibility',
	'public_at',
	'source',
];

const slugConflictError = (): CustomError =>
	new CustomError(409, lang('article.error.slug_already_exists'));

export class ArticleService {
	constructor(private repository: ReturnType<typeof getArticleRepository>) {}

	/**
	 * The slug check reads outside the transaction that writes the content, so two
	 * concurrent requests can both find the slug free and only the second one meets
	 * the `(slug, language)` unique index. Postgres answers that with a bare unique
	 * violation, which the error handler would mask as a 500 — mapped back onto the
	 * same 409 the pre-check raises so the race and the ordinary case read alike.
	 *
	 * The index is matched by name: the table carries a second unique index whose
	 * violation would mean something else entirely.
	 */
	private async withSlugGuard<T>(operation: () => Promise<T>): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			if (
				RepositoryAbstract.isUniqueViolation(error) &&
				error instanceof QueryFailedError &&
				error.driverError?.constraint === SLUG_UNIQUE_INDEX
			) {
				throw slugConflictError();
			}

			throw error;
		}
	}

	/**
	 * @description Used in `create` method from controller;
	 *
	 * `authorId` is the signed-in account, passed in rather than read from the payload: it
	 * records who filed the article and is not an editorial choice. The by-line a reader sees
	 * is `contents[].author`, which is per-language and overrides this field by field.
	 * `null` is allowed — the column is nullable so an article survives its author's deletion.
	 */
	public async create(
		data: ValidatorOutput<ArticleValidator, 'create'>,
		authorId: number | null,
	): Promise<ArticleEntity> {
		const conflict = await ArticleContentRepository.findConflictingSlug(
			data.contents,
		);

		if (conflict) {
			throw slugConflictError();
		}

		return this.withSlugGuard(() =>
			dataSource.transaction(async (manager) => {
				const repository = manager.getRepository(ArticleEntity);

				const entrySaved = await repository.save({
					layout: data.layout,
					publish_at: data.publish_at,
					archive_at: data.archive_at,
					featured_status: data.featured_status,
					featured_order: data.featured_order,
					visibility: data.visibility,
					public_at: data.public_at,
					source_mode: data.source_mode,
					source: data.source,
					author_id: authorId,
				});

				await this.saveRelations(manager, entrySaved, data);

				return entrySaved;
			}),
		);
	}

	/**
	 * @description Update any data
	 */
	public update(
		data: DeepPartial<ArticleEntity> & { id: number },
	): Promise<ArticleEntity> {
		return this.repository.save(data);
	}

	public async updateDataWithContent(
		entry: ArticleEntity,
		data: ValidatorOutput<ArticleValidator, 'update'>,
	): Promise<ArticleEntity> {
		if (data.contents?.length) {
			const conflict = await ArticleContentRepository.findConflictingSlug(
				data.contents,
				entry.id,
			);

			if (conflict) {
				throw slugConflictError();
			}
		}

		const updatedEntry = await this.withSlugGuard(() =>
			dataSource.transaction(async (manager) => {
				const repository = manager.getRepository(ArticleEntity);

				Object.assign(entry, pickValuesFromObject(data, entryColumns));

				this.assertPublishWindow(entry);

				const saved = await repository.save(entry);

				await this.saveRelations(manager, saved, data);

				await this.clearRestrictionWhenPublic(manager, saved);

				return saved;
			}),
		);

		/*
		 * One clean for the whole operation, emitted after the transaction commits.
		 *
		 * The contents, link rows and visibility rule written above carry no subscribers of
		 * their own: a row-level hook fires once per row (three translations meant three
		 * identical Redis SCANs) and it fires *inside* the transaction, where a concurrent
		 * reader can refill the cache from a snapshot that is about to be superseded. The
		 * service knows this was one operation on one article, and knows when it committed.
		 * Full reasoning on `cleanEntityCache`.
		 */
		cleanEntityCache(ArticleEntity, updatedEntry.id);

		return updatedEntry;
	}

	/**
	 * The publish window on the row as it will be saved.
	 *
	 * The validator already rejects a payload that carries both dates inverted, but it only
	 * sees the payload: an update that moves `archive_at` alone is compared against nothing
	 * there. This runs after the merge, where both values are known, and is the check that
	 * actually holds for a partial update.
	 */
	private assertPublishWindow(entry: ArticleEntity): void {
		if (!entry.publish_at || !entry.archive_at) {
			return;
		}

		if (entry.archive_at > entry.publish_at) {
			return;
		}

		throw new CustomError(
			422,
			lang('article.validation.archive_before_publish'),
		);
	}

	/**
	 * Contents, links and the visibility rule are all optional on update and absent means
	 * "leave alone" — an empty array, on the other hand, clears the links.
	 */
	private async saveRelations(
		manager: EntityManager,
		entry: ArticleEntity,
		data: Partial<ValidatorOutput<ArticleValidator, 'create'>>,
	): Promise<void> {
		await ArticleContentRepository.saveContent(
			manager,
			data.contents ?? [],
			entry.id,
		);

		if (data.categories) {
			await ArticleCategoryRepository.syncLinks(
				manager,
				entry.id,
				data.categories,
			);
		}

		if (data.tags) {
			await ArticleTagRepository.syncLinks(manager, entry.id, data.tags);
		}

		if (data.visibility_rule) {
			await this.saveVisibilityRule(
				manager,
				entry.id,
				data.visibility_rule,
			);
		}
	}

	/**
	 * Public visibility owns no restriction state, so an article moved back to `public` drops
	 * its deadline and its rule row — the same end state the release cron produces.
	 *
	 * This lives here rather than in the payload because a form cannot express it: an optional
	 * date parsed from an absent value comes through as `undefined`, which TypeORM reads as "no
	 * change", so the UI has no way to send "clear this". The rule is derivable from
	 * `visibility` anyway, which makes the server the right place to enforce it.
	 */
	private async clearRestrictionWhenPublic(
		manager: EntityManager,
		entry: ArticleEntity,
	): Promise<void> {
		if (entry.visibility !== ArticleVisibilityEnum.PUBLIC) {
			return;
		}

		if (entry.public_at) {
			entry.public_at = null;

			await manager.getRepository(ArticleEntity).save(entry);
		}

		await manager
			.getRepository(ArticleVisibilityRuleEntity)
			.softDelete({ article_id: entry.id });
	}

	/**
	 * The rule row carries a plain UNIQUE on `article_id`, so a soft-deleted rule keeps its
	 * slot — the existing row is restored and overwritten rather than replaced by a new one.
	 */
	private async saveVisibilityRule(
		manager: EntityManager,
		article_id: number,
		rule: ArticleVisibilityRuleType,
	): Promise<void> {
		const repository = manager.getRepository(ArticleVisibilityRuleEntity);

		const existing = await repository.findOne({
			where: { article_id },
			withDeleted: true,
		});

		const entry = existing ?? repository.create({ article_id });

		entry.deleted_at = null;
		entry.requires_auth = rule.requires_auth;
		entry.requires_subscription = rule.requires_subscription ?? null;
		entry.allowed_countries = rule.allowed_countries ?? null;
		entry.is_listed = rule.is_listed;

		// An omitted password leaves the stored hash alone; an empty string clears it
		if (rule.password !== undefined) {
			entry.password = rule.password
				? await encryptPassword(rule.password)
				: null;
		}

		await repository.save(entry);
	}

	/**
	 * Ends an article's restriction: `visibility` goes public, the deadline that scheduled it is
	 * consumed, and the rule row is soft-deleted so a stale password or country list cannot come
	 * back with a later re-restriction.
	 *
	 * One transaction, because a released article still carrying its rule row would read as
	 * restricted to anything that consults the rule before the visibility.
	 *
	 * The `visibility` history entry is emitted on top of the `updated` one the subscriber
	 * writes: the audit trail has to say *what* changed, and a bare "updated" from a cron run
	 * does not distinguish this from an editor saving a typo.
	 */
	public async releaseRestricted(entry: ArticleEntity): Promise<void> {
		await dataSource.transaction(async (manager) => {
			entry.visibility = ArticleVisibilityEnum.PUBLIC;
			entry.public_at = null;

			await manager.getRepository(ArticleEntity).save(entry);

			await manager
				.getRepository(ArticleVisibilityRuleEntity)
				.softDelete({ article_id: entry.id });
		});

		eventEmitter.emit('history', {
			entity: ArticleEntity.NAME,
			entity_ids: [entry.id],
			action: LogHistoryActionEnum.VISIBILITY,
		});
	}

	public async updateStatus(
		entry: ArticleEntity,
		newStatus: ArticleStatus,
	): Promise<void> {
		assertValidStatusTransition(
			STATUS_TRANSITIONS,
			entry.status,
			newStatus,
		);

		entry.status = newStatus;

		await this.update(entry);
	}

	/**
	 * Reorders one featured group. `featured_order` is a plain int on the article, so the group
	 * the positions belong to is decided here, not by the column: `section` is every article
	 * carrying that flag, `category` is the articles flagged for a category slot and linked to
	 * the given category **or any of its descendants** — the order page lists a subtree, so the
	 * write has to accept the same set the page showed.
	 *
	 * The submitted ids must be a complete reordering of that set. A subset would silently leave
	 * the untouched rows sharing positions with the moved ones, which reads as a random order.
	 *
	 * Saved row by row through the repository rather than a bulk UPDATE so the subscribers fire
	 * — same reason as the cron jobs.
	 */
	public async updateOrder(
		data: ValidatorOutput<ArticleValidator, 'orderUpdate'>,
	): Promise<void> {
		await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(ArticleEntity);

			const query = repository
				.createQueryBuilder('article')
				.where('article.featured_status = :featured_status', {
					featured_status: data.featured_status,
				});

			if (data.category_id) {
				const categoryIds = await this.resolveCategorySubtree(
					data.category_id,
				);

				query
					.innerJoin('article.categories', 'link')
					.andWhere('link.category_id IN (:...categoryIds)', {
						categoryIds,
					});
			}

			const entries = await query.getMany();

			const foundIds = new Set(entries.map((entry) => entry.id));
			const allProvidedAreValid = data.positions.every((id) =>
				foundIds.has(id),
			);

			if (
				entries.length !== data.positions.length ||
				!allProvidedAreValid
			) {
				throw new CustomError(
					400,
					lang('article.validation.invalid_ids_provided'),
				);
			}

			// Descending, so the first article in the list carries the highest weight — the
			// same convention `brand.updateOrder` writes and the public listing reads.
			const ordered = entries.map((entry) => {
				entry.featured_order =
					data.positions.length - data.positions.indexOf(entry.id);

				return entry;
			});

			await repository.save(ordered);
		});
	}

	/**
	 * The category and every category beneath it, as ids.
	 *
	 * Every `category_id` filter in this service resolves through here, so "in this category"
	 * means the same thing to the listing, the public feed and `updateOrder`. They have to
	 * agree: the order page lists a subtree and then posts that exact set back, and a write
	 * that recognised only the direct links would reject its own list as incomplete.
	 */
	private async resolveCategorySubtree(
		category_id: number,
	): Promise<number[]> {
		const treeRepository =
			RepositoryAbstract.getTreeRepository(CategoryEntity);

		const category = await treeRepository.findOneOrFail({
			where: { id: category_id },
		});

		const descendants = await treeRepository.findDescendants(category);

		return descendants.map((descendant) => descendant.id);
	}

	public async delete(id: number) {
		await this.repository.createQuery().filterById(id).delete();
	}

	public async restore(id: number) {
		await this.repository.createQuery().filterById(id).restore();
	}

	public findById(id: number, withDeleted: boolean): Promise<ArticleEntity> {
		return this.repository
			.createQuery()
			.filterById(id)
			.withDeleted(withDeleted)
			.firstOrFail();
	}

	/**
	 * The two author sources answer different questions and both are kept: `author_id` is the
	 * account that owns the article, `content.author` is the by-line as it should read in that
	 * language. The by-line wins field by field, so a translated bio or a pen name overrides
	 * the account without having to restate the parts it agrees with.
	 */
	private resolveAuthor(
		entry: ArticleEntity,
		contentAuthor: ArticleAuthorType | null,
	): ArticleAuthorType | null {
		if (!entry.author && !contentAuthor) {
			return null;
		}

		return {
			...(entry.author
				? { name: entry.author.name, email: entry.author.email }
				: {}),
			...Object.fromEntries(
				Object.entries(contentAuthor ?? {}).filter(
					([, value]) => value !== undefined && value !== null,
				),
			),
		} as ArticleAuthorType;
	}

	/**
	 * @description Used in `read` method from controller; this will return a custom shape
	 */
	public async getEntryData(data: {
		id: number;
		language?: string;
		withDeleted: boolean;
	}) {
		const query = this.repository
			.createQuery()
			.select([
				'article.id',
				'article.status',
				'article.layout',
				'article.publish_at',
				'article.archive_at',
				'article.featured_status',
				'article.featured_order',
				'article.visibility',
				'article.public_at',
				'article.source_mode',
				'article.source',
				'article.author_id',
				'article.created_at',
				'article.updated_at',
				'article.deleted_at',

				'content.language',
				'content.slug',
				'content.title',
				'content.brief',
				'content.content',
				'content.author',
				'content.meta',

				'author.id',
				'author.name',
				'author.email',

				'category.category_id',
				'tag.tag_id',
			])
			.filterById(data.id)
			.withDeleted(data.withDeleted)
			.joinAndSelect('article.author', 'author', 'LEFT')
			.joinAndSelect('article.categories', 'category', 'LEFT')
			.joinAndSelect('article.tags', 'tag', 'LEFT');

		if (data.language) {
			query.joinAndSelect(
				'article.contents',
				'content',
				'INNER',
				'content.language = :language',
				{
					language: data.language,
				},
			);
		} else {
			// No language: take all contents
			query.joinAndSelect('article.contents', 'content', 'LEFT');
		}

		const entry = await query.firstOrFail();

		for (const content of entry.contents ?? []) {
			content.author = this.resolveAuthor(entry, content.author);
		}

		if (entry.visibility === ArticleVisibilityEnum.RESTRICTED) {
			// Loaded separately so the rule's `password` hash never rides along in the
			// selected columns of the main query
			entry.visibility_rule = await dataSource
				.getRepository(ArticleVisibilityRuleEntity)
				.findOne({
					where: { article_id: entry.id },
					select: {
						requires_auth: true,
						requires_subscription: true,
						allowed_countries: true,
						is_listed: true,
					},
				});
		}

		return entry;
	}

	/**
	 * @description Used in `publicRead` from controller — the anonymous surface.
	 *
	 * Keyed on the content slug rather than the id: a public URL is `/blog/<slug>`, and the
	 * slug is unique per language. Only the display window is reachable, so a draft or an
	 * archived article answers 404 to a visitor instead of leaking its existence through a
	 * different status code.
	 */
	public resolvePublicRef(
		slug: string,
		language: string,
	): Promise<ArticleAccessTarget> {
		return this.repository
			.createQuery()
			.select(['article.id', 'article.visibility'])
			.join(
				'article.contents',
				'content',
				'INNER',
				'content.language = :language AND content.slug = :slug',
				{ language, slug },
			)
			.filterPublished(true)
			.firstOrFail();
	}

	/**
	 * @description Used in `publicRead` from controller, behind the cache.
	 *
	 * Keyed by id rather than slug on purpose: `SubscriberAbstract.cacheClean` invalidates by
	 * the `<entity>:<id>*` prefix, so a slug-keyed entry would survive an edit until its TTL.
	 * Resolving the slug first (`resolvePublicRef`) also keeps the publish window and the
	 * visibility out of the cached value — both decide access and both move without the
	 * payload changing.
	 */
	public getPublicEntryById(id: number, language: string) {
		return this.repository
			.createQuery()
			.select([
				'article.id',
				'article.status',
				'article.layout',
				'article.publish_at',
				'article.visibility',
				'article.source_mode',
				'article.source',
				'article.author_id',
				'article.created_at',
				'article.updated_at',

				'content.language',
				'content.slug',
				'content.title',
				'content.brief',
				'content.content',
				'content.author',
				'content.meta',

				'author.id',
				'author.name',

				'category.category_id',
				'tag.tag_id',
			])
			.joinAndSelect(
				'article.contents',
				'content',
				'INNER',
				'content.language = :language',
				{ language },
			)
			.joinAndSelect('article.author', 'author', 'LEFT')
			.joinAndSelect('article.categories', 'category', 'LEFT')
			.joinAndSelect('article.tags', 'tag', 'LEFT')
			.filterById(id)
			.firstOrFail();
	}

	/**
	 * @description Used in `publicFind` from controller — the anonymous listing.
	 *
	 * A restricted article is listed only while its rule says `is_listed`; a public one is
	 * always listed. The rule is LEFT-joined so a public article with no rule row survives
	 * the condition.
	 */
	public async findByFilterPublic(
		data: ValidatorOutput<ArticleValidator, 'publicFind'>,
	) {
		const query = this.repository
			.createQuery()
			.join(
				'article.contents',
				'content',
				'INNER',
				'content.language = :language',
				{ language: data.filter.language },
			)
			.join('article.author', 'author', 'LEFT')
			.join('article.visibility_rule', 'rule', 'LEFT')
			.select([
				'article.id',
				'article.publish_at',
				'article.featured_status',
				'article.featured_order',
				'article.visibility',

				'content.language',
				'content.slug',
				'content.title',
				'content.brief',
				'content.author',
				'content.meta',

				'author.id',
				'author.name',
			])
			.filterBy('article.featured_status', data.filter.featured_status)
			.filterByTerm(data.filter.term)
			.filterPublished(true)
			.filterRaw(
				`(article.visibility = :publicVisibility OR rule.is_listed = true)`,
				{ publicVisibility: ArticleVisibilityEnum.PUBLIC },
			);

		if (data.filter.category_id) {
			query
				.join('article.categories', 'category', 'INNER')
				.filterRaw('category.category_id IN (:...categoryIds)', {
					categoryIds: await this.resolveCategorySubtree(
						data.filter.category_id,
					),
				});
		}

		if (data.filter.tag_id) {
			query
				.join('article.tags', 'tag', 'INNER')
				.filterBy('tag.tag_id', data.filter.tag_id);
		}

		return query
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}

	public async findByFilter(
		data: ValidatorOutput<ArticleValidator, 'find'>,
		withDeleted: boolean,
	) {
		const query = this.repository
			.createQuery()
			.join(
				'article.contents',
				'content',
				'LEFT',
				'content.language = :language',
				{
					language: data.filter.language,
				},
			)
			.join('article.author', 'author', 'LEFT')
			.select([
				'article.id',
				'article.status',
				'article.publish_at',
				'article.archive_at',
				'article.featured_status',
				'article.featured_order',
				'article.visibility',
				'article.source_mode',
				'article.author_id',
				'article.created_at',
				'article.updated_at',
				'article.deleted_at',

				'content.language',
				'content.slug',
				'content.title',
				'content.brief',
				'content.author',
				'content.meta',

				'author.id',
				'author.name',
			])
			.filterById(data.filter.id)
			.filterBy('article.status', data.filter.status)
			.filterBy('article.visibility', data.filter.visibility)
			.filterBy('article.featured_status', data.filter.featured_status)
			.filterBy('article.source_mode', data.filter.source_mode)
			.filterBy('article.author_id', data.filter.author_id)
			.filterByTerm(data.filter.term)
			.filterPublished(data.filter.is_published)
			.withDeleted(withDeleted && data.filter.is_deleted);

		if (data.filter.category_id) {
			query
				.join('article.categories', 'category', 'INNER')
				.filterRaw('category.category_id IN (:...categoryIds)', {
					categoryIds: await this.resolveCategorySubtree(
						data.filter.category_id,
					),
				});
		}

		if (data.filter.tag_id) {
			query
				.join('article.tags', 'tag', 'INNER')
				.filterBy('tag.tag_id', data.filter.tag_id);
		}

		return query
			.orderBy(data.order_by, data.direction)
			.pagination(data.page, data.limit)
			.all(true);
	}
}

export const articleService = new ArticleService(getArticleRepository());
