import type { DeepPartial, EntityManager } from 'typeorm';
import dataSource from '@/config/data-source.config';
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
import type { ArticleAuthorType } from '@/features/article/article-content.entity';
import ArticleContentRepository from '@/features/article/article-content.repository';
import ArticleTagRepository from '@/features/article/article-tag.repository';
import ArticleVisibilityRuleEntity from '@/features/article/article-visibility-rule.entity';
import { pickValuesFromObject } from '@/helpers/objects.helper';
import { encryptPassword } from '@/helpers/security.helper';
import {
	assertValidStatusTransition,
	cleanEntityCache,
} from '@/shared/abstracts/service.abstract';
import type { ValidatorOutput } from '@/shared/types/mock.type';

/**
 * Columns owned by the term row itself.
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
	'author_id',
];

export class ArticleService {
	constructor(private repository: ReturnType<typeof getArticleRepository>) {}

	/**
	 * @description Used in `create` method from controller;
	 */
	public async create(
		data: ValidatorOutput<ArticleValidator, 'create'>,
	): Promise<ArticleEntity> {
		const conflict = await ArticleContentRepository.findConflictingSlug(
			data.contents,
		);

		if (conflict) {
			throw new CustomError(
				409,
				lang('article.error.slug_already_exists'),
			);
		}

		return dataSource.transaction(async (manager) => {
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
				author_id: data.author_id,
			});

			await this.saveRelations(manager, entrySaved, data);

			return entrySaved;
		});
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
				throw new CustomError(
					409,
					lang('article.error.slug_already_exists'),
				);
			}
		}

		const updatedEntry = await dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(ArticleEntity);

			Object.assign(entry, pickValuesFromObject(data, entryColumns));

			const saved = await repository.save(entry);

			await this.saveRelations(manager, saved, data);

			return saved;
		});

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
				'content.content_blocks',
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
				'content.content_blocks',
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
	public findByFilterPublic(
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
				.filterBy('category.category_id', data.filter.category_id);
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

	public findByFilter(
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
				.filterBy('category.category_id', data.filter.category_id);
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
