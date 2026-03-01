import { z } from 'zod';
import { lang } from '@/config/i18n.setup';
import { isValidDate, stringToDate } from '@/helpers';
import { PlaceTypeEnum } from '@/shared/types/place.type';

export type CheckPlaceTypeFn = (
	id: number,
	type: PlaceTypeEnum,
) => Promise<boolean>;

export type ValidatorInput<V, K extends keyof V> = V[K] extends (
	...args: unknown[]
) => z.ZodTypeAny
	? z.input<ReturnType<V[K]>>
	: never;

export type ValidatorOutput<V, K extends keyof V> = V[K] extends (
	...args: unknown[]
) => z.ZodTypeAny
	? z.output<ReturnType<V[K]>>
	: never;

type AddressFields = {
	address_country?: number;
	address_region?: number;
	address_city?: number;
};

export abstract class BaseValidator {
	/**
	 * @description Make string nullable and optional
	 */
	protected nullableString(msg: string) {
		return z.preprocess(
			(v) => (v === '' ? null : v),
			z.string({ message: msg }).trim().nullable().optional(),
		);
	}

	/**
	 * @description Used in validators to make string required
	 */
	protected validateString(message: string) {
		return z.string().trim().nonempty({ message });
	}

	/**
	 * @description Ensures the value is a positive number (> 0).
	 * @param message Error message
	 * @param onlyPositive Allow only positive numbers (default: true)
	 * @param allowDecimals Allow decimal numbers (default: false)
	 */
	protected validateNumber(
		message: string,
		onlyPositive = true,
		allowDecimals = false,
	) {
		let schema = z.number({ message });

		if (onlyPositive) {
			schema = schema.positive({ message });
		}

		if (!allowDecimals) {
			schema = schema.int({ message });
		}

		return schema;
	}

	/**
	 * @description Convert string to boolean and validate
	 */
	protected validateBoolean(
		message = lang('shared.validation.invalid_boolean'),
	) {
		return z.preprocess((val) => {
			if (val === 'true' || val === true) {
				return true;
			}

			if (val === 'false' || val === false) {
				return false;
			}

			return val;
		}, z.boolean({ message }));
	}

	/**
	 * @description Validate date string and convert to `Date` object
	 */
	protected validateDate(
		message = lang('shared.validation.invalid_date'),
		optional = true,
	) {
		const schema = z
			.string()
			.refine((val) => isValidDate(val), { message })
			.transform((val) => stringToDate(val));

		return optional ? schema.optional() : schema;
	}

	/**
	 * @description Validate enum value
	 */
	protected validateEnum<T extends Record<string, string>>(
		enumObj: T,
		message: string,
	) {
		return z.enum(enumObj, { message });
	}

	/**
	 * @description Build a string schema with a minimum length.
	 */
	protected validateStringMin(
		messageInvalid: string,
		min: number,
		messageMin: string,
	) {
		return z
			.string({ message: messageInvalid })
			.min(min, { message: messageMin });
	}

	/**
	 * @description Build a find validator
	 */
	protected makeFindValidator<
		TOrderBy extends Record<string, string>,
		TDirection extends Record<string, string>,
		TFilter extends z.ZodRawShape,
	>(options: {
		orderByEnum: TOrderBy;
		defaultOrderBy: TOrderBy[keyof TOrderBy];
		directionEnum: TDirection;
		defaultDirection: TDirection[keyof TDirection];
		defaultLimit: number;
		defaultPage: number;
		filterShape: TFilter;
	}) {
		const {
			orderByEnum,
			defaultOrderBy,
			directionEnum,
			defaultDirection,
			defaultLimit,
			defaultPage,
			filterShape,
		} = options;

		return z.object({
			order_by: z.enum(orderByEnum).optional().default(defaultOrderBy),

			direction: z
				.enum(directionEnum)
				.optional()
				.default(defaultDirection),

			limit: z.coerce
				.number({ message: lang('shared.validation.invalid_number') })
				.min(1)
				.optional()
				.default(defaultLimit),

			page: z.coerce
				.number({ message: lang('shared.validation.invalid_number') })
				.min(1)
				.optional()
				.default(defaultPage),

			// filter: this.makeJsonFilterSchema(filterShape),
			filter: z.object(filterShape).partial(),
		});
	}

	/**
	 * Validates that address place IDs match the expected place types (country/region/city).
	 * Requires a checker function so shared code does not depend on the place feature.
	 */
	protected async validateAddressPlaceTypes(
		data: AddressFields,
		ctx: z.RefinementCtx,
		checkPlaceType: CheckPlaceTypeFn,
	) {
		const checks: Array<{
			field: keyof AddressFields;
			type: PlaceTypeEnum;
			error: string;
		}> = [
			{
				field: 'address_country',
				type: PlaceTypeEnum.COUNTRY,
				error: lang('place.validation.address_country_invalid'),
			},
			{
				field: 'address_region',
				type: PlaceTypeEnum.REGION,
				error: lang('place.validation.address_region_invalid'),
			},
			{
				field: 'address_city',
				type: PlaceTypeEnum.CITY,
				error: lang('place.validation.address_city_invalid'),
			},
		];

		for (const check of checks) {
			const id = data[check.field];

			if (!id) {
				continue;
			}

			const isValid = await checkPlaceType(id, check.type);

			if (!isValid) {
				ctx.addIssue({
					path: [check.field],
					code: 'custom',
					message: check.error,
				});
			}
		}
	}

	protected validateMeta() {
		return z.object({
			title: this.validateString(
				lang('shared.validation.meta_title_invalid'),
			),
			description: this.validateString(
				lang('shared.validation.meta_description_invalid'),
			).optional(),
			keywords: this.validateString(
				lang('shared.validation.meta_keywords_invalid'),
			).optional(),
		});
	}

	protected validateLanguage() {
		return z.string().length(2, {
			message: lang('shared.validation.language_invalid'),
		});
	}
}
