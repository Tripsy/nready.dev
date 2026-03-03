import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { Configuration } from '@/config/settings.config';
import { hasAtLeastOneValue } from '@/helpers';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import { BaseValidator } from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = [
	'name',
	'website',
	'phone',
	'email',
	'notes',
];

export enum OrderByEnum {
	ID = 'id',
	NAME = 'name',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
}

export class CarrierValidator extends BaseValidator {
	private readonly defaultFilterLimit = Configuration.get(
		'filter.limit',
	) as number;

	public create() {
		return z.object({
			name: this.validateString(lang('carrier.validation.name_invalid')),
			website: z.preprocess(
				(val) => (val === '' ? null : val),
				z
					.url({
						message: lang('carrier.validation.website_invalid'),
					})
					.nullable()
					.optional(),
			),
			phone: this.validateString(
				lang('carrier.validation.phone_invalid'),
			).optional(),
			email: z.preprocess(
				(val) => (val === '' ? null : val),
				z
					.email({
						message: lang('carrier.validation.email_invalid'),
					})
					.nullable()
					.optional(),
			),
			notes: this.validateString(
				lang('carrier.validation.notes_invalid'),
			).optional(),
		});
	}

	public update() {
		return z
			.object({
				name: this.validateString(
					lang('carrier.validation.name_invalid'),
				).optional(),
				website: z.preprocess(
					(val) => (val === '' ? null : val),
					z
						.url({
							message: lang('carrier.validation.website_invalid'),
						})
						.nullable()
						.optional(),
				),
				phone: this.validateString(
					lang('carrier.validation.phone_invalid'),
				).optional(),
				email: z.preprocess(
					(val) => (val === '' ? null : val),
					z
						.email({
							message: lang('carrier.validation.email_invalid'),
						})
						.nullable()
						.optional(),
				),
				notes: this.validateString(
					lang('carrier.validation.notes_invalid'),
				).optional(),
			})
			.refine((data) => hasAtLeastOneValue(data), {
				message: lang('shared.validation.params_at_least_one', {
					params: paramsUpdateList.join(', '),
				}),
				path: ['_global'],
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

export const carrierValidator = new CarrierValidator();
