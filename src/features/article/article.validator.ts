import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import {
	ArticleFeaturedStatusEnum,
	ArticleLayoutEnum,
	ArticleSourceModeEnum,
	ArticleStatusEnum,
	ArticleVisibilityEnum,
} from '@/features/article/article.entity';
import { hasAtLeastOneValue } from '@/helpers/objects.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

/**
 * `source_mode` is deliberately absent: it records whether the parser owns the article, so it
 * is set once on create and never accepted from an update payload. `author_id` is absent for a
 * different reason — it is the account that filed the article, stamped from the session on
 * create, and a per-language by-line goes in `contents[].author` instead.
 */
export const paramsUpdateList: string[] = [
	'layout',
	'publish_at',
	'archive_at',
	'featured_status',
	'featured_order',
	'visibility',
	'visibility_rule',
	'public_at',
	'source',
	'contents',
	'categories',
	'tags',
];

export const OrderByEnum = {
	ID: 'id',
	PUBLISH_AT: 'publish_at',
	FEATURED_ORDER: 'featured_order',
	CREATED_AT: 'created_at',
} as const;

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_title',
	'invalid_slug',
	'invalid_brief',
	'invalid_content',
	'invalid_author',
	'invalid_layout',
	'invalid_featured_status',
	'invalid_featured_order',
	'invalid_visibility',
	'invalid_visibility_rule',
	'invalid_source',
	'invalid_source_mode',
	'invalid_categories',
	'invalid_tags',
	'archive_before_publish',
] as const;

export class ArticleValidator extends BaseValidator<typeof validatorMessages> {
	readonly authorSchema = z
		.object({
			name: this.validateString(this.getMessage('invalid_author')),
			email: this.validateString(this.getMessage('invalid_author'), {
				required: false,
			}),
			avatar: this.validateString(this.getMessage('invalid_author'), {
				required: false,
			}),
			description: this.validateString(
				this.getMessage('invalid_author'),
				{
					required: false,
				},
			),
		})
		.nullable()
		.optional();

	readonly contentsSchema = z.object({
		language: this.validateLanguage(this.getMessage('invalid_language')),
		slug: this.validateString(this.getMessage('invalid_slug')).transform(
			(val) => val.trim().toLowerCase(),
		),
		title: this.validateString(this.getMessage('invalid_title')),
		brief: this.validateString(this.getMessage('invalid_brief'), {
			required: false,
		}),
		content: this.validateString(this.getMessage('invalid_content')),
		author: this.authorSchema,
		meta: this.validateMeta({
			invalid_meta_title: this.getMessage('invalid_meta_title'),
			invalid_meta_description: this.getMessage(
				'invalid_meta_description',
			),
			invalid_meta_keywords: this.getMessage('invalid_meta_keywords'),
		}),
	});

	readonly visibilityRuleSchema = z
		.object({
			requires_auth: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
			requires_subscription: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
			allowed_countries: z
				.array(
					z
						.string({
							message: this.getMessage('invalid_visibility_rule'),
						})
						.length(2)
						.transform((val) => val.toUpperCase()),
				)
				.nullable()
				.optional(),
			password: this.validateString(
				this.getMessage('invalid_visibility_rule'),
				{ required: false },
			),
			is_listed: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{
					required: false,
				},
			).default(true),
		})
		.optional();

	readonly sourceSchema = z
		.object({
			label: this.validateString(this.getMessage('invalid_source'), {
				required: false,
			}),
			url: this.validateString(this.getMessage('invalid_source'), {
				required: false,
			}),
			disclaimer: this.validateString(this.getMessage('invalid_source'), {
				required: false,
			}),
			about: this.validateString(this.getMessage('invalid_source'), {
				required: false,
			}),
		})
		.nullable()
		.optional();

	readonly idListSchema = (message: string) =>
		z
			.array(
				z.coerce
					.number({ message: message })
					.int({ message: message })
					.positive({ message: message }),
				{ message: message },
			)
			.optional();

	/**
	 * An article whose archive deadline falls on or before its release is never displayed at
	 * all. Both dates are optional on their own, so this only bites when a payload carries the
	 * pair — a partial update that moves one of them is checked against the stored row in
	 * `ArticleService.assertPublishWindow`.
	 */
	private readonly refinePublishWindow = (
		data: { publish_at?: Date | null; archive_at?: Date | null },
		ctx: z.RefinementCtx,
	): void => {
		if (!data.publish_at || !data.archive_at) {
			return;
		}

		if (data.archive_at > data.publish_at) {
			return;
		}

		ctx.addIssue({
			code: 'custom',
			path: ['archive_at'],
			message: this.getMessage('archive_before_publish'),
		});
	};

	readonly create = z
		.object({
			layout: this.validateEnum(
				ArticleLayoutEnum,
				this.getMessage('invalid_layout'),
				{ required: false },
			),
			publish_at: this.validateDate(this.getMessage('invalid_date'), {
				required: false,
			}),
			archive_at: this.validateDate(this.getMessage('invalid_date'), {
				required: false,
			}),
			featured_status: this.validateEnum(
				ArticleFeaturedStatusEnum,
				this.getMessage('invalid_featured_status'),
				{ required: false },
			),
			featured_order: this.validateNumber(
				this.getMessage('invalid_featured_order'),
				{ required: false },
			),
			visibility: this.validateEnum(
				ArticleVisibilityEnum,
				this.getMessage('invalid_visibility'),
				{ required: false },
			),
			visibility_rule: this.visibilityRuleSchema,
			public_at: this.validateDate(this.getMessage('invalid_date'), {
				required: false,
			}),
			source_mode: this.validateEnum(
				ArticleSourceModeEnum,
				this.getMessage('invalid_source_mode'),
				{ required: false },
			),
			source: this.sourceSchema,
			contents: this.contentsSchema
				.array()
				.min(1, this.getMessage('invalid_contents'))
				.refine(
					(contents) => {
						const languages = contents.map(
							(content) => content.language,
						);

						return new Set(languages).size === languages.length;
					},
					{ message: this.getMessage('duplicate_contents') },
				),
			categories: this.idListSchema(
				this.getMessage('invalid_categories'),
			),
			tags: this.idListSchema(this.getMessage('invalid_tags')),
		})
		.superRefine(this.refinePublishWindow);

	readonly read = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
	});

	readonly update = z
		.object({
			id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
			layout: this.validateEnum(
				ArticleLayoutEnum,
				this.getMessage('invalid_layout'),
				{ required: false },
			),
			publish_at: this.validateDate(this.getMessage('invalid_date'), {
				required: false,
			}),
			archive_at: this.validateDate(this.getMessage('invalid_date'), {
				required: false,
			}),
			featured_status: this.validateEnum(
				ArticleFeaturedStatusEnum,
				this.getMessage('invalid_featured_status'),
				{ required: false },
			),
			featured_order: this.validateNumber(
				this.getMessage('invalid_featured_order'),
				{ required: false },
			),
			visibility: this.validateEnum(
				ArticleVisibilityEnum,
				this.getMessage('invalid_visibility'),
				{ required: false },
			),
			visibility_rule: this.visibilityRuleSchema,
			public_at: this.validateDate(this.getMessage('invalid_date'), {
				required: false,
			}),
			source: this.sourceSchema,
			contents: this.contentsSchema
				.array()
				.refine(
					(contents) => {
						const languages = contents.map(
							(content) => content.language,
						);

						return new Set(languages).size === languages.length;
					},
					{ message: this.getMessage('duplicate_contents') },
				)
				.optional(),
			categories: this.idListSchema(
				this.getMessage('invalid_categories'),
			),
			tags: this.idListSchema(this.getMessage('invalid_tags')),
		})
		.refine((data) => hasAtLeastOneValue(data, paramsUpdateList), {
			message: this.getMessage('params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		})
		.superRefine(this.refinePublishWindow);

	readonly delete = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly restore = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly find = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.ID,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.DESC,

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		filterSchema: {
			id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength'),
			}),
			status: this.validateEnum(
				ArticleStatusEnum,
				this.getMessage('invalid_status'),
				{ required: false },
			),
			visibility: this.validateEnum(
				ArticleVisibilityEnum,
				this.getMessage('invalid_visibility'),
				{ required: false },
			),
			featured_status: this.validateEnum(
				ArticleFeaturedStatusEnum,
				this.getMessage('invalid_featured_status'),
				{ required: false },
			),
			source_mode: this.validateEnum(
				ArticleSourceModeEnum,
				this.getMessage('invalid_source_mode'),
				{ required: false },
			),
			author_id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			category_id: this.validateNumber(
				this.getMessage('invalid_number'),
				{
					required: false,
				},
			),
			tag_id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{
					required: false,
				},
			),
			// The display window (published, released, not archived) — see
			// `ArticleQuery.filterPublished`
			is_published: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{
					required: false,
				},
			).default(false),
		},
	});

	/**
	 * The anonymous surface. `password` is the shared access password from an article's
	 * visibility rule, not a user credential — it arrives on the query string because the
	 * route is a GET.
	 */
	readonly publicRead = z.object({
		slug: this.validateString(this.getMessage('invalid_slug')).transform(
			(val) => val.trim().toLowerCase(),
		),
		language: this.validateLanguage(this.getMessage('invalid_language'), {
			required: false,
		}),
		password: this.validateString(
			this.getMessage('invalid_visibility_rule'),
			{ required: false },
		),
	});

	readonly publicFind = this.validateFind({
		orderByEnum: OrderByEnum,
		defaultOrderBy: OrderByEnum.PUBLISH_AT,

		directionEnum: OrderDirectionEnum,
		defaultDirection: OrderDirectionEnum.DESC,

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		// Deliberately narrower than `find`: no status, no visibility, no is_deleted, no
		// author filter. A visitor can only ever address the display window, so a filter that
		// could widen it must not exist on this schema at all
		filterSchema: {
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength'),
			}),
			featured_status: this.validateEnum(
				ArticleFeaturedStatusEnum,
				this.getMessage('invalid_featured_status'),
				{ required: false },
			),
			category_id: this.validateNumber(
				this.getMessage('invalid_number'),
				{
					required: false,
				},
			),
			tag_id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{
					required: false,
				},
			),
		},
	});

	/**
	 * The ordering group is a scope, not a single column: `section` is every article flagged for
	 * the section slot, `category` is the articles under one category subtree. `category_id` is
	 * therefore required for the second and meaningless for the first, which is what the refine
	 * enforces — the service resolves the subtree and rejects a set that is not the whole group.
	 */
	readonly orderUpdate = z
		.object({
			featured_status: this.validateEnum(
				ArticleFeaturedStatusEnum,
				this.getMessage('invalid_featured_status'),
			),
			category_id: this.validateId(
				this.getMessage('invalid_id', { name: 'category_id' }),
				{ required: false },
			),
			positions: z
				.array(
					z.number({
						message: this.getMessage('invalid_number'),
					}),
				)
				.min(2, {
					message: this.getMessage('array_min', {
						length: '2',
					}),
				}),
		})
		.refine(
			(data) =>
				data.featured_status !== ArticleFeaturedStatusEnum.CATEGORY ||
				!!data.category_id,
			{
				message: this.getMessage('invalid_id', {
					name: 'category_id',
				}),
				path: ['category_id'],
			},
		);

	readonly statusUpdate = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
		status: this.validateEnum(
			ArticleStatusEnum,
			this.getMessage('invalid_status'),
		),
	});
}

export type ArticleContentType = z.infer<ArticleValidator['contentsSchema']>;
export type ArticleVisibilityRuleType = NonNullable<
	z.infer<ArticleValidator['visibilityRuleSchema']>
>;
