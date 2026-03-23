import { Configuration } from '@/config/settings.config';
import type { discountController } from '@/features/discount/discount.controller';
import {
	DiscountReasonEnum,
	DiscountScopeEnum,
	DiscountTypeEnum,
} from '@/features/discount/discount.entity';
import {
	discountInputPayloads,
	getDiscountEntityMock,
} from '@/features/discount/discount.mock';
import { OrderByEnum } from '@/features/discount/discount.validator';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

export const docs: Record<
	keyof typeof discountController,
	ApiInputDocumentation
> = {
	create: helperApiInputDocumentation({
		description: 'Create a new discount',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Discount created successfully',
			dataSample: getDiscountEntityMock() as unknown as Record<
				string,
				unknown
			>,
		},
		withAuthErrors: true,
		withErrors: [400, 422],
		request: {
			body: {
				label: { type: 'string', required: true },
				scope: {
					type: 'enum',
					required: true,
					values: Object.values(DiscountScopeEnum),
				},
				reason: {
					type: 'enum',
					required: true,
					values: Object.values(DiscountReasonEnum),
				},
				reference: { type: 'string', required: false },
				type: {
					type: 'enum',
					required: true,
					values: Object.values(DiscountTypeEnum),
				},
				rules: {
					type: 'object',
					required: false,
					format: 'Record<string, number | number[] | string | string[]>',
				},
				value: {
					type: 'number',
					required: true,
					condition: 'positive',
				},
				start_at: {
					type: 'string',
					format: 'date-time',
					required: false,
				},
				end_at: {
					type: 'string',
					format: 'date-time',
					required: false,
				},
				notes: { type: 'string', required: false },
			},
			sample: discountInputPayloads.create,
		},
	}),
	read: helperApiInputDocumentation({
		description: 'Get discount details',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Discount details',
			dataSample: getDiscountEntityMock() as unknown as Record<
				string,
				unknown
			>,
		},
		withAuthErrors: true,
		withErrors: [404],
		request: {
			params: {
				id: {
					type: 'number',
					required: true,
				},
			},
		},
	}),
	update: helperApiInputDocumentation({
		description: 'Update discount',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Discount updated successfully',
			dataSample: getDiscountEntityMock() as unknown as Record<
				string,
				unknown
			>,
		},
		withAuthErrors: true,
		withErrors: [400, 404, 422],
		request: {
			params: {
				id: {
					type: 'number',
					required: true,
				},
			},
			notes: 'Provide at least one body parameter',
			body: {
				label: { type: 'string', required: false },
				scope: {
					type: 'enum',
					required: false,
					values: Object.values(DiscountScopeEnum),
				},
				reason: {
					type: 'enum',
					required: false,
					values: Object.values(DiscountReasonEnum),
				},
				reference: { type: 'string', required: false },
				type: {
					type: 'enum',
					required: false,
					values: Object.values(DiscountTypeEnum),
				},
				rules: {
					type: 'object',
					required: false,
					format: 'Record<string, number | number[] | string | string[]>',
				},
				value: {
					type: 'number',
					required: false,
					condition: 'positive',
				},
				start_at: {
					type: 'string',
					format: 'date-time',
					required: false,
				},
				end_at: {
					type: 'string',
					format: 'date-time',
					required: false,
				},
				notes: { type: 'string', required: false },
			},
			sample: discountInputPayloads.update,
		},
	}),
	delete: helperApiInputDocumentation({
		description: 'Delete discount',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Discount deleted with success',
		},
		withAuthErrors: true,
		withErrors: [404],
		request: {
			params: {
				id: {
					type: 'number',
					required: true,
				},
			},
		},
	}),
	restore: helperApiInputDocumentation({
		description: 'Restore discount',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Discount restored with success',
		},
		withAuthErrors: true,
		withErrors: [404],
		request: {
			params: {
				id: {
					type: 'number',
					required: true,
				},
			},
		},
	}),
	find: helperApiInputDocumentation({
		description: 'Get discounts',
		withBearerAuth: true,
		success: {
			status: 200,
			description: 'Discount list',
			dataSample: {
				entries: [],
				pagination: {
					page: 1,
					limit: 5,
					total: 0,
				},
				query: {
					order_by: 'id',
					direction: 'DESC',
					limit: 5,
					page: 1,
					filter: {
						term: 'zone.ro',
						is_deleted: true,
					},
				},
			},
		},
		withAuthErrors: true,
		request: {
			query: {
				page: {
					type: 'number',
					required: false,
					default: 1,
				},
				limit: {
					type: 'number',
					required: false,
					default: Configuration.get('filter.limit'),
				},
				order_by: {
					type: 'enum',
					required: false,
					values: Object.values(OrderByEnum),
					default: OrderByEnum.ID,
				},
				direction: {
					type: 'enum',
					required: false,
					values: Object.values(OrderDirectionEnum),
					default: OrderDirectionEnum.ASC,
				},
				filter: {
					id: {
						type: 'number',
						required: false,
					},
					term: {
						type: 'string',
						required: false,
					},
					scope: {
						type: 'enum',
						required: false,
						values: Object.values(DiscountScopeEnum),
					},
					reason: {
						type: 'enum',
						required: false,
						values: Object.values(DiscountReasonEnum),
					},
					type: {
						type: 'enum',
						required: false,
						values: Object.values(DiscountTypeEnum),
					},
					reference: {
						type: 'string',
						required: false,
					},
					start_at_start: {
						type: 'string',
						format: 'date-time',
						required: false,
					},
					start_at_end: {
						type: 'string',
						format: 'date-time',
						required: false,
					},
					is_deleted: {
						type: 'boolean',
						required: false,
						default: false,
					},
				},
			},
		},
	}),
};
