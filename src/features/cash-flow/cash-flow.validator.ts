import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import {
	CashFlowCategoryEnum,
	CashFlowCategoryTypeEnum,
	CashFlowDirectionEnum,
	CashFlowGatewayEnum,
	CashFlowMethodEnum,
	CashFlowStatusEnum,
	CurrencyEnum,
	getExpectedCategoryType,
	getExpectedDirection,
} from '@/features/cash-flow/cash-flow.entity';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'direction',
	'category_type',
	'category',
	'gateway',
	'method',
	'amount',
	'vat_rate',
	'currency',
	// 'exchange_rate',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
	GATEWAY = 'gateway',
	CATEGORY = 'category',
	CATEGORY_TYPE = 'category_type',
	METHOD = 'method',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export class CashFlowValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		return z
			.object({
				direction: this.validateEnum(
					CashFlowDirectionEnum,
					lang('cash-flow.validation.direction_invalid'),
				),
				category_type: this.validateEnum(
					CashFlowCategoryTypeEnum,
					lang('cash-flow.validation.category_type_invalid'),
				),
				category: this.validateEnum(
					CashFlowCategoryEnum,
					lang('cash-flow.validation.category_invalid'),
				),
				gateway: this.validateEnum(
					CashFlowGatewayEnum,
					lang('cash-flow.validation.gateway_invalid'),
				),
				method: this.validateEnum(
					CashFlowMethodEnum,
					lang('cash-flow.validation.method_invalid'),
				),
				amount: this.validateNumber(
					lang('cash-flow.validation.amount_invalid'),
					true,
					false,
				),
				vat_rate: this.validateNumber(
					lang('cash-flow.validation.amount_invalid'),
					true,
					true,
				),
				currency: this.validateEnum(
					CurrencyEnum,
					lang('cash-flow.validation.currency_invalid'),
				),
				// exchange_rate: this.validateNumber(
				// 	lang('cash-flow.validation.exchange_rate_invalid'),
				// 	true,
				// 	true,
				// ),
				external_reference: this.validateString(
					lang('cash-flow.validation.external_reference_invalid'),
				).optional(),
				parent_id: z
					.number({
						message: lang('cash-flow.validation.parent_id_invalid'),
					})
					.optional(),
				notes: this.nullableString(
					lang('cash-flow.validation.notes_invalid'),
				),
			})
			.superRefine((data, ctx) => {
				const expectedCategoryType = getExpectedCategoryType(
					data.category,
				);

				if (data.category_type !== expectedCategoryType) {
					ctx.addIssue({
						path: ['category_type'],
						message: lang(
							'cash-flow.error.category_type_mismatch',
							{
								category: data.category,
								category_type: expectedCategoryType,
							},
						),
						code: 'custom',
					});
				}

				const expectedDirection = getExpectedDirection(
					data.category_type,
				);

				if (expectedDirection && data.direction !== expectedDirection) {
					ctx.addIssue({
						path: ['direction'],
						message: lang('cash-flow.error.direction_mismatch', {
							category: data.category,
							direction: expectedDirection,
						}),
						code: 'custom',
					});
				}

				// Validate refund rules
				if (data.parent_id) {
					if (data.category !== CashFlowCategoryEnum.REFUND) {
						ctx.addIssue({
							path: ['category'],
							message: lang(
								'cash-flow.validation.category_invalid',
							),
							code: 'custom',
						});
					}
				}
			});
	}

	public update() {
		return z
			.object({
				direction: this.validateEnum(
					CashFlowDirectionEnum,
					lang('cash-flow.validation.direction_invalid'),
				),
				category_type: this.validateEnum(
					CashFlowCategoryTypeEnum,
					lang('cash-flow.validation.category_type_invalid'),
				),
				category: this.validateEnum(
					CashFlowCategoryEnum,
					lang('cash-flow.validation.category_invalid'),
				),
				gateway: this.validateEnum(
					CashFlowGatewayEnum,
					lang('cash-flow.validation.gateway_invalid'),
				),
				method: this.validateEnum(
					CashFlowMethodEnum,
					lang('cash-flow.validation.method_invalid'),
				),
				amount: this.validateNumber(
					lang('cash-flow.validation.amount_invalid'),
					false,
					true,
				),
				vat_rate: this.validateNumber(
					lang('cash-flow.validation.vat_rate_invalid'),
					true,
					true,
				),
				currency: this.validateEnum(
					CurrencyEnum,
					lang('cash-flow.validation.currency_invalid'),
				),
				// exchange_rate: this.validateNumber(
				// 	lang('cash-flow.validation.exchange_rate_invalid'),
				// 	true,
				// 	true,
				// ),
				external_reference: this.validateString(
					lang('cash-flow.validation.external_reference_invalid'),
				).optional(),
				notes: this.validateString(
					lang('cash-flow.validation.notes_invalid'),
				).optional(),
			})
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: paramsUpdateList.join(', '),
				}),
				path: ['_global'],
			})
			.superRefine((data, ctx) => {
				const expectedCategoryType = getExpectedCategoryType(
					data.category,
				);

				if (data.category_type !== expectedCategoryType) {
					ctx.addIssue({
						path: ['category_type'],
						message: lang(
							'cash-flow.error.category_type_mismatch',
							{
								category: data.category,
								category_type: expectedCategoryType,
							},
						),
						code: 'custom',
					});
				}

				const expectedDirection = getExpectedDirection(
					data.category_type,
				);

				if (expectedDirection && data.direction !== expectedDirection) {
					ctx.addIssue({
						path: ['direction'],
						message: lang('cash-flow.error.direction_mismatch', {
							category: data.category,
							direction: expectedDirection,
						}),
						code: 'custom',
					});
				}
			});
	}

	public find() {
		return this.makeFindValidator({
			orderByEnum: OrderByEnum,
			defaultOrderBy: OrderByEnum.ID,

			directionEnum: OrderDirectionEnum,
			defaultDirection: OrderDirectionEnum.ASC,

			defaultLimit: this.defaultFilterLimit,
			defaultPage: 1,

			filterShape: {
				id: z.coerce
					.number({
						message: lang('shared.validation.invalid_number'),
					})
					.optional(),
				direction: z.enum(CashFlowDirectionEnum).optional(),
				category_type: z.enum(CashFlowCategoryTypeEnum).optional(),
				category: z.enum(CashFlowCategoryEnum).optional(),
				gateway: z.enum(CashFlowGatewayEnum).optional(),
				method: z.enum(CashFlowMethodEnum).optional(),
				status: z.enum(CashFlowStatusEnum).optional(),
				create_date_start: this.validateDate(),
				create_date_end: this.validateDate(),
				term: z
					.string({
						message: lang('shared.validation.invalid_string'),
					})
					.optional(),
				is_deleted: this.validateBoolean().default(false),
			},
		});
	}
}

export const cashFlowValidator = new CashFlowValidator();
