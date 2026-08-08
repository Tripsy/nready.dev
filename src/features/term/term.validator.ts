import { z } from 'zod';
import { Configuration } from '@/config/settings.config';
import { TermTypeEnum } from '@/features/term/term.entity';
import { hasAtLeastOneValue } from '@/helpers/objects.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';
import {
	BaseValidator,
	sharedValidatorMessages,
} from '@/shared/abstracts/validator.abstract';

export const paramsUpdateList: string[] = ['type', 'language', 'value'];

export const OrderByEnum = {
	ID: 'id',
	VALUE: 'value',
} as const;

const validatorMessages = [
	...sharedValidatorMessages,
	'invalid_type',
	'invalid_value',
] as const;

/** Matches the `value` column width, so a rejected input never reaches the database. */
const VALUE_MAX_CHARS = 255;

export class TermValidator extends BaseValidator<typeof validatorMessages> {
	readonly create = z.object({
		type: this.validateEnum(TermTypeEnum, this.getMessage('invalid_type')),
		language: this.validateLanguage(this.getMessage('invalid_language')),
		value: this.validateString(this.getMessage('invalid_value'), {
			maxChars: VALUE_MAX_CHARS,
		}),
	});

	readonly read = z.object({
		id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
	});

	readonly update = z
		.object({
			id: this.validateId(this.getMessage('invalid_id', { name: 'id' })),
			type: this.validateEnum(
				TermTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{ required: false },
			),
			value: this.validateString(this.getMessage('invalid_value'), {
				required: false,
				maxChars: VALUE_MAX_CHARS,
			}),
		})
		.refine((data) => hasAtLeastOneValue(data, paramsUpdateList), {
			message: this.getMessage('params_at_least_one', {
				params: paramsUpdateList.join(', '),
			}),
			path: ['_global'],
		});

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
		defaultDirection: OrderDirectionEnum.ASC,

		defaultLimit: Configuration.get('filter.limit'),
		defaultPage: 1,

		filterSchema: {
			id: this.validateNumber(this.getMessage('invalid_number'), {
				required: false,
			}),
			type: this.validateEnum(
				TermTypeEnum,
				this.getMessage('invalid_type'),
				{ required: false },
			),
			language: this.validateLanguage(
				this.getMessage('invalid_language'),
				{ required: false },
			),
			term: this.validateString(this.getMessage('invalid_string'), {
				required: false,
				minChars: Configuration.get('filter.termMinLength'),
			}),
			is_deleted: this.validateBoolean(
				this.getMessage('invalid_boolean'),
				{ required: false },
			).default(false),
		},
	});
}
