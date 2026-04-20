import { z } from 'zod';
import dayjs from '@/config/dayjs.config';
import { Configuration } from '@/config/settings.config';
import { isValidDate, replaceVars } from '@/helpers';

export abstract class IsValidator {
	/**
	 * Checks if the provided IBAN (RO version) is valid.
	 *
	 * @param {string} iban
	 * @returns {boolean}
	 */
	protected isValidIBAN(iban: string): boolean {
		const clean = iban.replace(/\s+/g, '').toUpperCase();

		// Must be exactly 24 chars
		if (!/^RO\d{2}[A-Z]{4}\d{16}$/.test(clean)) {
			return false;
		}

		const rearranged = clean.slice(4) + clean.slice(0, 4);

		let remainder = rearranged.replace(/[A-Z]/g, (char) =>
			(char.charCodeAt(0) - 55).toString(),
		);

		while (remainder.length > 2) {
			remainder =
				(parseInt(remainder.slice(0, 9), 10) % 97).toString() +
				remainder.slice(9);
		}

		return parseInt(remainder, 10) % 97 === 1;
	}

	/**
	 * Checks if the provided postal code is valid.
	 *
	 * @param {string} postalCode
	 * @returns {boolean}
	 */
	protected isValidPostalCode(postalCode: string): boolean {
		return /^[0-9]{6}$/.test(postalCode);
	}

	/**
	 * Checks if the provided phone number is valid.
	 *
	 * @param {string} _phoneNumber
	 * @returns {boolean}
	 */
	protected isValidPhoneNumber(_phoneNumber: string): boolean {
		return true;
	}

	/**
	 * Checks if the provided CNP is valid.
	 *
	 * @param {string} cnp
	 * @returns {boolean}
	 */
	protected isValidCNP(cnp: string): boolean {
		return /^[0-9]{13}$/.test(cnp);
	}
}

type EmptyValue = null | undefined;

export abstract class BaseValidator<
	TMessage extends Record<string, string>,
	TEmpty extends EmptyValue = undefined, // null - for FE; undefined - for BE
> extends IsValidator {
	private readonly emptyValue: TEmpty;

	constructor(
		private readonly message: TMessage,
		options?: { emptyValue?: TEmpty },
	) {
		super();

		this.emptyValue = options?.emptyValue ?? (undefined as TEmpty);
	}

	protected getMessage(key: keyof TMessage, vars?: Record<string, string>) {
		const message = this.message[key];

		if (!vars) {
			return message;
		}

		return replaceVars(message, vars);
	}

	/**
	 * Coerces null input values to the configured empty value (null or undefined)
	 * before passing to the schema.
	 *
	 * @param {z.ZodTypeAny} schema - The Zod schema to apply the transformation to
	 * @returns A preprocessed schema that converts null to the configured empty value
	 */
	private coerceEmpty(schema: z.ZodTypeAny) {
		const empty = this.emptyValue;

		return z.preprocess((val) => {
			return val === null ? empty : val;
		}, schema);
	}

	/**
	 * Preprocesses a schema to handle optional fields
	 */
	private preprocessOptional<T extends z.ZodTypeAny>(schema: T) {
		const empty = this.emptyValue;

		return z.preprocess(
			(val) => {
				if (val === null || val === undefined || val === '') {
					return empty;
				}
				return val;
			},
			empty === null ? schema.nullable() : schema.optional(),
		);
	}

	/**
	 * Builds a message object by merging default messages with custom messages
	 */
	private buildMessage(
		messageDefault: Record<string, string>,
		messageData?: string | Record<string, string>,
	) {
		if (!messageData) {
			return messageDefault;
		}

		if (typeof messageData === 'string') {
			return {
				...messageDefault,
				invalid: messageData,
			};
		}

		return {
			...messageDefault,
			...messageData,
		};
	}

	/**
	 * Creates a required string validator with optional length constraints
	 *
	 * @example
	 * // Required string
	 * validateString('Name is required')
	 *
	 * // With custom messages & options
	 * validateString({
	 *   invalid: 'Invalid name',
	 *   min_chars: 'Name too short',
	 *   max_chars: 'Name too long'
	 * }, {
	 *   minChars: 2,
	 *   maxChars: 50
	 * })
	 *
	 * // With min length only
	 * validateString('Password is required', { minChars: 8 })
	 */
	// Overload signatures
	protected validateString(
		messageData?:
			| string
			| { invalid?: string; min_chars?: string; max_chars?: string },
		optionsData?: { required?: true; minChars?: number; maxChars?: number },
	): z.ZodType<string>;

	protected validateString(
		messageData?:
			| string
			| { invalid?: string; min_chars?: string; max_chars?: string },
		optionsData?: { required: false; minChars?: number; maxChars?: number },
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validateString(
		messageData?:
			| string
			| { invalid?: string; min_chars?: string; max_chars?: string },
		optionsData?: {
			required?: boolean;
			minChars?: number;
			maxChars?: number;
		},
	): z.ZodType<string | TEmpty> {
		const defaultMessages: Record<string, string> = {
			invalid: 'Invalid value (e.g.: string required)',
		};

		const options = {
			required: true,
			...optionsData,
		};

		if (options?.minChars) {
			defaultMessages.min_chars = `Value must be at least ${options.minChars} characters long`;
		}

		if (options?.maxChars) {
			defaultMessages.max_chars = `Value must be at most ${options.maxChars} characters long`;
		}

		const message = this.buildMessage(defaultMessages, messageData);

		let baseSchema = z.string({ message: message.invalid }).trim();

		// Apply length constraints
		if (options?.minChars) {
			baseSchema = baseSchema.min(options.minChars, {
				message:
					message.min_chars ??
					`Minimum ${options.minChars} characters required`,
			});
		}

		if (options?.maxChars) {
			baseSchema = baseSchema.max(options.maxChars, {
				message:
					message.max_chars ??
					`Maximum ${options.maxChars} characters allowed`,
			});
		}

		if (options.required) {
			if (!options?.minChars && !options?.maxChars) {
				return this.coerceEmpty(
					baseSchema.min(1, { message: message.invalid }),
				) as z.ZodType<string>;
			} else {
				return this.coerceEmpty(baseSchema) as z.ZodType<string>;
			}
		}

		return this.preprocessOptional(baseSchema) as z.ZodType<
			string | TEmpty
		>;
	}

	/**
	 * @description Validate number
	 *
	 * @example
	 * // Required number
	 * validateNumber('Name is required')
	 *
	 * // With custom messages & options
	 * validateNumber({
	 *   invalid: 'Invalid name',
	 *   only_positive: 'Only positive number',
	 *   no_decimals: 'Decimals not allowed'
	 * }, {
	 *   onlyPositive: true,
	 *   allowDecimals: false
	 * })
	 */
	// Overload signatures
	protected validateNumber(
		messageData?:
			| string
			| {
					invalid?: string;
					only_positive?: string;
					no_decimals?: string;
			  },
		optionsData?: {
			required?: true;
			onlyPositive?: boolean;
			allowDecimals?: boolean;
		},
	): z.ZodType<number>;

	protected validateNumber(
		messageData?:
			| string
			| {
					invalid?: string;
					only_positive?: string;
					no_decimals?: string;
			  },
		optionsData?: {
			required: false;
			onlyPositive?: boolean;
			allowDecimals?: boolean;
		},
	): z.ZodType<number | TEmpty>;

	// Implementation signature
	protected validateNumber(
		messageData?:
			| string
			| {
					invalid?: string;
					only_positive?: string;
					no_decimals?: string;
			  },
		optionsData?: {
			required?: boolean;
			onlyPositive?: boolean;
			allowDecimals?: boolean;
		},
	): z.ZodType<number | TEmpty> {
		const options = {
			required: true,
			onlyPositive: true,
			allowDecimals: false,
			...optionsData,
		};

		const defaultMessages: Record<string, string> = {
			invalid: 'Invalid value (e.g.: number required)',
		};

		if (options.onlyPositive) {
			defaultMessages.onlyPositive = 'Must be a positive number';
		}

		if (!options.allowDecimals) {
			defaultMessages.noDecimals = 'Must not contain decimals';
		}

		const message = this.buildMessage(defaultMessages, messageData);

		let baseSchema = z.coerce.number({ message: message.invalid });

		if (options.onlyPositive) {
			baseSchema = baseSchema.positive({
				message: message.only_positive,
			});
		}

		if (!options.allowDecimals) {
			baseSchema = baseSchema.int({ message: message.no_decimals });
		}

		if (options.required) {
			return this.coerceEmpty(baseSchema) as z.ZodType<number>;
		}

		return this.preprocessOptional(baseSchema) as z.ZodType<
			number | TEmpty
		>;
	}

	/**
	 * Validate enum value
	 */
	// Overload signatures
	protected validateEnum<T extends Record<string, string>>(
		enumObj: T,
		message: string,
		optionsData?: { required?: true },
	): z.ZodType<T[keyof T]>;

	protected validateEnum<T extends Record<string, string>>(
		enumObj: T,
		message: string,
		optionsData: { required: false },
	): z.ZodType<T[keyof T] | TEmpty>;

	// Implementation signature
	protected validateEnum<T extends Record<string, string>>(
		enumObj: T,
		message: string,
		optionsData?: { required?: boolean },
	): z.ZodType<T[keyof T] | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const values = Object.values(enumObj);
		const baseSchema = z.enum(values, { message });

		if (options.required) {
			return baseSchema as unknown as z.ZodType<T[keyof T]>;
		}

		return this.preprocessOptional(baseSchema) as unknown as z.ZodType<
			T[keyof T] | TEmpty
		>;
	}

	/**
	 * Convert string to boolean and validate - rejects false values if options.required = true
	 */
	// Overload signatures
	protected validateBoolean(
		message?: string,
		optionsData?: { required?: true },
	): z.ZodType<boolean>;

	protected validateBoolean(
		message: string,
		optionsData: { required: false },
	): z.ZodType<boolean | TEmpty>;

	// Implementation signature
	protected validateBoolean(
		message: string = 'This field must be true',
		optionsData?: {
			required?: boolean;
		},
	): z.ZodType<boolean | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const baseSchema = z.preprocess((val) => {
			if (val === 'true' || val === true) {
				return true;
			}

			if (val === 'false' || val === false) {
				return false;
			}

			return val;
		}, z.boolean({ message }));

		if (options.required) {
			return baseSchema.refine((val) => val === true, { message });
		}

		return baseSchema;
	}

	/**
	 * Validate ID
	 */
	protected validateId(
		message: string = 'Invalid ID',
		optionsData?: { required?: boolean },
	): z.ZodType<number | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		if (options.required) {
			return this.validateNumber(message, {
				required: true,
				onlyPositive: true,
				allowDecimals: false,
			});
		}

		return this.validateNumber(message, {
			required: false,
			onlyPositive: true,
			allowDecimals: false,
		});
	}

	/**
	 * Validate date string and convert to `Date` object with time validation
	 *
	 * This validator handles both client-side (local time) and server-side (UTC with timezone)
	 * date validation. It automatically detects the runtime environment but allows explicit override.
	 *
	 * @param messageData - Optional string or object with custom error messages
	 * @param optionsData - Configuration options for date validation
	 *
	 * @example
	 * // Basic usage
	 * const basicSchema = validateDate({
	 *   invalid: 'Please enter a valid date'
	 * });
	 *
	 * @example
	 * // Client-side with time requirement and 1-hour future limit
	 * const appointmentSchema = validateDate({
	 *   invalid_date: 'Invalid appointment date',
	 *   invalid_date_format: 'Please use format: YYYY-MM-DD HH:MM',
	 *   invalid_future_date: 'Appointments cannot be more than 1 hour in the future'
	 * }, {
	 *   requireTime: true,
	 *   maxFutureSeconds: 3600 // 1 hour
	 * });
	 *
	 * @example
	 * // Server-side with Romania timezone and 24-hour past limit
	 * const serverSchema = validateDate({
	 *   invalid_date: 'Invalid date',
	 *   invalid_past_date: 'Not older than 24h',
	 *   invalid_future_date: 'Cannot set a future date'
	 * }, {
	 *   runtime: 'server',
	 *   timezone: 'Europe/Bucharest',
	 *   requireTime: true,
	 *   maxPastSeconds: 86400 // 24 hours
	 * });
	 *
	 * @example
	 * // Custom date format (European format)
	 * const europeanSchema = validateDate({
	 *   invalid_date: 'Invalid date',
	 *   invalid_date_format: 'Use format: DD.MM.YYYY'
	 * }, {
	 *   dateFormat: /^\d{2}\.\d{2}\.\d{4}$/,
	 *   requireTime: false
	 * });
	 *
	 * @example
	 * // Complete example with all options
	 * const fullSchema = validateDate({
	 *   invalid_date: 'Invalid date',
	 *   invalid_date_format: 'Format must be YYYY-MM-DD HH:MM',
	 *   invalid_past_date: 'Cannot be more than 1 hour in the past',
	 *   invalid_future_date: 'Cannot be more than 2 hours in the future'
	 * }, {
	 *   runtime: 'server',
	 *   timezone: 'Europe/Bucharest',
	 *   dateFormat: /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}$/,
	 *   requireTime: true,
	 *   maxPastSeconds: 3600, // 1 hour
	 *   maxFutureSeconds: 7200 // 2 hours
	 * });
	 *
	 * @throws {Error} If runtime is 'server' and no timezone is provided
	 */
	// Overload signatures
	protected validateDate(
		messageData?:
			| string
			| {
					invalid_date: string;
					invalid_date_format: string;
					invalid_past_date: string;
					invalid_future_date: string;
			  },
		optionsData?: {
			required?: true;
			runtime?: 'client' | 'server';
			timezone?: string;
			dateFormat?: RegExp;
			requireTime?: boolean;
			maxPastSeconds?: number;
			maxFutureSeconds?: number;
		},
	): z.ZodType<Date>;

	protected validateDate(
		messageData:
			| string
			| {
					invalid_date: string;
					invalid_date_format: string;
					invalid_past_date: string;
					invalid_future_date: string;
			  },
		optionsData: {
			required: false;
			runtime?: 'client' | 'server';
			timezone?: string;
			dateFormat?: RegExp;
			requireTime?: boolean;
			maxPastSeconds?: number;
			maxFutureSeconds?: number;
		},
	): z.ZodType<Date | TEmpty>;

	// Implementation signature
	protected validateDate(
		messageData?:
			| string
			| {
					invalid_date: string;
					invalid_date_format: string;
					invalid_past_date: string;
					invalid_future_date: string;
			  },
		optionsData?: {
			required?: boolean;
			runtime?: 'client' | 'server';
			timezone?: string; // IANA timezone, e.g., 'Europe/Bucharest'
			dateFormat?: RegExp;
			requireTime?: boolean;
			maxPastSeconds?: number;
			maxFutureSeconds?: number;
		},
	): z.ZodType<Date | TEmpty> {
		const options = {
			required: true,
			runtime: typeof window === 'undefined' ? 'server' : 'client', // Auto-detect
			timezone: Configuration.get('app.timezone') as string,
			dateFormat: /^\d{4}-\d{2}-\d{2}/,
			requireTime: false,
			...optionsData,
		};

		const defaultMessages: Record<string, string> = {
			invalid_date: 'Invalid date',
		};

		// Validate timezone for server runtime
		if (options.runtime === 'server' && !options.timezone) {
			throw new Error(
				'Timezone is required for server-side date validation',
			);
		}

		if (options.requireTime) {
			options.dateFormat =
				optionsData?.dateFormat ??
				/^\d{4}-\d{2}-\d{2}[T\s](?:[01]\d|2[0-3]):[0-5]\d/;
			defaultMessages.invalid_date_format =
				'Date must include time (e.g., 2024-01-15 14:30 or 2024-01-15T14:30:00)';
		}

		if (options.maxPastSeconds) {
			defaultMessages.invalid_past_date = `Date cannot be more than ${options.maxPastSeconds} seconds in the past`;
		}

		if (options.maxFutureSeconds) {
			defaultMessages.invalid_future_date = `Date cannot be more than ${options.maxFutureSeconds} seconds in the future`;
		}

		const message = this.buildMessage(defaultMessages, messageData);

		let stringSchema = z.string();

		stringSchema = stringSchema.refine(
			(val) => options.dateFormat.test(val),
			{
				message: message.invalid_date_format,
			},
		);

		stringSchema = stringSchema.refine((val) => isValidDate(val), {
			message: message.invalid_date,
		});

		const getSecondsDiff = (val: string): number => {
			if (options.runtime === 'server') {
				// Server: Parse in provided timezone, compare in UTC
				const dateInTimezone = dayjs.tz(val, options.timezone);
				const now = dayjs.utc();

				return now.diff(dateInTimezone, 'second');
			} else {
				// Client: Use local time
				return dayjs().diff(dayjs(val), 'second');
			}
		};

		stringSchema = stringSchema.refine(
			(val) => {
				if (options.maxPastSeconds === undefined) {
					return true;
				}

				const secondsDiff = getSecondsDiff(val);

				if (secondsDiff > 0) {
					return secondsDiff <= options.maxPastSeconds;
				}

				return true;
			},
			{
				message: message.invalid_past_date,
			},
		);

		stringSchema = stringSchema.refine(
			(val) => {
				if (options.maxFutureSeconds === undefined) {
					return true;
				}

				const secondsDiff = getSecondsDiff(val);

				if (secondsDiff < 0) {
					return Math.abs(secondsDiff) <= options.maxFutureSeconds;
				}

				return true;
			},
			{
				message: message.invalid_future_date,
			},
		);

		const dateSchema = stringSchema.transform((val) => {
			if (options.runtime === 'server') {
				// Server: Convert to UTC Date object
				return dayjs.tz(val, options.timezone).utc().toDate();
			} else {
				// Client: Return local Date object
				return dayjs(val).toDate();
			}
		});

		if (options.required) {
			return this.coerceEmpty(dateSchema) as z.ZodType<Date>;
		}

		return this.preprocessOptional(dateSchema) as z.ZodType<Date | TEmpty>;
	}

	/**
	 * @description Build a find validator
	 */
	protected validateFind<
		TOrderBy extends Record<string, string>,
		TDirection extends Record<string, string>,
		TFilter extends z.ZodRawShape,
	>(
		options: {
			orderByEnum: TOrderBy;
			defaultOrderBy: TOrderBy[keyof TOrderBy];
			directionEnum: TDirection;
			defaultDirection: TDirection[keyof TDirection];
			defaultLimit: number;
			defaultPage: number;
			filterShape: TFilter;
		},
		messageData?: {
			invalid_limit: string;
			invalid_page: string;
		},
	) {
		const {
			orderByEnum,
			defaultOrderBy,
			directionEnum,
			defaultDirection,
			defaultLimit,
			defaultPage,
			filterShape,
		} = options;

		const message = this.buildMessage(
			{
				invalid_limit: 'Invalid limit',
				invalid_page: 'Invalid page',
			},
			messageData,
		);

		return z.object({
			order_by: z.enum(orderByEnum).optional().default(defaultOrderBy),

			direction: z
				.enum(directionEnum)
				.optional()
				.default(defaultDirection),

			limit: z.coerce
				.number({ message: message.invalid_limit })
				.min(1)
				.optional()
				.default(defaultLimit),

			page: z.coerce
				.number({ message: message.invalid_number })
				.min(1)
				.optional()
				.default(defaultPage),

			// Note: Do not add `optional()` types will break in *.service.ts files
			filter: z.object(filterShape).partial(),
		});
	}

	protected validateMeta(
		message = {
			invalid_meta_title: 'Invalid title',
			invalid_meta_description: 'Invalid description',
			invalid_meta_keywords: 'Invalid keywords',
		},
	) {
		return z.object({
			title: this.validateString(message.invalid_meta_title, {
				required: false,
			}),
			description: this.validateString(message.invalid_meta_description, {
				required: false,
			}),
			keywords: this.validateString(message.invalid_meta_keywords, {
				required: false,
			}),
		});
	}

	// Overload signatures
	protected validateLanguage(
		message?: string,
		optionsData?: {
			required?: true;
		},
	): z.ZodType<string>;

	protected validateLanguage(
		message: string,
		optionsData: {
			required: false;
		},
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validateLanguage(
		message = 'Invalid language',
		optionsData?: { required?: boolean },
	): z.ZodType<string | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const baseSchema = z.string().length(2, { message });

		if (options.required) {
			return this.coerceEmpty(baseSchema) as z.ZodType<string>;
		}

		return this.preprocessOptional(baseSchema) as z.ZodType<
			string | TEmpty
		>;
	}

	// Overload signatures
	protected validatePassword(
		message: {
			invalid_password: string;
			password_min: string;
			password_condition_capital_letter: string;
			password_condition_number: string;
			password_condition_special_character: string;
		},
		optionsData: {
			required?: true;
			minLength: number;
			requireUppercase?: boolean;
			requireNumber?: boolean;
			requireSpecial?: boolean;
		},
	): z.ZodType<string>;

	protected validatePassword(
		message: {
			invalid_password: string;
			password_min: string;
			password_condition_capital_letter: string;
			password_condition_number: string;
			password_condition_special_character: string;
		},
		optionsData: {
			required: false;
			minLength: number;
			requireUppercase?: boolean;
			requireNumber?: boolean;
			requireSpecial?: boolean;
		},
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validatePassword(
		message: {
			invalid_password: string;
			password_min: string;
			password_condition_capital_letter: string;
			password_condition_number: string;
			password_condition_special_character: string;
		},
		optionsData?: {
			required?: boolean;
			minLength: number;
			requireUppercase?: boolean;
			requireNumber?: boolean;
			requireSpecial?: boolean;
		},
	): z.ZodType<string | TEmpty> {
		const options = {
			required: true,
			minLength: 8,
			requireUppercase: true,
			requireNumber: true,
			requireSpecial: true,
			...optionsData,
		};

		let baseSchema = z
			.string(message.invalid_password)
			.min(options.minLength, {
				message: message.password_min,
			});

		// Add refinements based on requirements
		if (options.requireUppercase) {
			baseSchema = baseSchema.refine((value) => /[A-Z]/.test(value), {
				message: message.password_condition_capital_letter,
			});
		}

		if (options.requireNumber) {
			baseSchema = baseSchema.refine((value) => /[0-9]/.test(value), {
				message: message.password_condition_number,
			});
		}

		if (options.requireSpecial) {
			baseSchema = baseSchema.refine(
				(value) => /[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]/.test(value),
				{
					message: message.password_condition_special_character,
				},
			);
		}

		if (options.required) {
			return baseSchema;
		}

		return this.preprocessOptional(baseSchema) as z.ZodType<
			string | TEmpty
		>;
	}

	// Overload signatures
	protected validateEmail(
		message: string,
		optionsData?: { required?: true },
	): z.ZodType<string>;

	protected validateEmail(
		message: string,
		optionsData?: { required: false },
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validateEmail(
		message: string = 'Invalid email address',
		optionsData?: { required?: boolean },
	): z.ZodType<string | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const baseSchema = z.email({ message });

		if (options.required) {
			return this.coerceEmpty(baseSchema) as z.ZodType<string>;
		}

		const optionalSchema = baseSchema
			.transform((val) => (val === '' ? undefined : val))
			.optional();

		return this.coerceEmpty(optionalSchema) as z.ZodType<string | TEmpty>;
	}

	// Overload signatures
	protected validateIBAN(
		message: string,
		optionsData?: { required?: true },
	): z.ZodType<string>;

	protected validateIBAN(
		message: string,
		optionsData?: { required: false },
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validateIBAN(
		message: string = 'Invalid IBAN',
		optionsData?: {
			required?: boolean;
		},
	): z.ZodType<string | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const baseSchema = z
			.string({ message })
			.trim()
			.refine((val) => this.isValidIBAN(val), { message });

		if (options.required) {
			return this.coerceEmpty(baseSchema) as z.ZodType<string>;
		}

		const optionalSchema = baseSchema
			.transform((val) => (val === '' ? undefined : val))
			.optional();

		return this.coerceEmpty(optionalSchema) as z.ZodType<string | TEmpty>;
	}

	// Overload signatures
	protected validatePersonalIdentificationNumber(
		message: string,
		optionsData?: { required?: true },
	): z.ZodType<string>;

	protected validatePersonalIdentificationNumber(
		message: string,
		optionsData?: { required: false },
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validatePersonalIdentificationNumber(
		message: string = 'Invalid CNP',
		optionsData?: {
			required?: boolean;
		},
	): z.ZodType<string | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const baseSchema = z
			.string({ message })
			.trim()
			.refine((val) => this.isValidCNP(val), { message });

		if (options.required) {
			return this.coerceEmpty(baseSchema) as z.ZodType<string>;
		}

		const optionalSchema = baseSchema
			.transform((val) => (val === '' ? undefined : val))
			.optional();

		return this.coerceEmpty(optionalSchema) as z.ZodType<string | TEmpty>;
	}

	// Overload signatures
	protected validatePostalCode(
		message: string,
		optionsData?: { required?: true },
	): z.ZodType<string>;

	protected validatePostalCode(
		message: string,
		optionsData?: { required: false },
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validatePostalCode(
		message: string = 'Invalid postal code',
		optionsData?: {
			required?: boolean;
		},
	): z.ZodType<string | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const baseSchema = z
			.string({ message })
			.trim()
			.refine((val) => this.isValidPostalCode(val), { message });

		if (options.required) {
			return this.coerceEmpty(baseSchema) as z.ZodType<string>;
		}

		const optionalSchema = baseSchema
			.transform((val) => (val === '' ? undefined : val))
			.optional();

		return this.coerceEmpty(optionalSchema) as z.ZodType<string | TEmpty>;
	}

	// Overload signatures
	protected validatePhone(
		message: string,
		optionsData?: { required?: true },
	): z.ZodType<string>;

	protected validatePhone(
		message: string,
		optionsData?: { required: false },
	): z.ZodType<string | TEmpty>;

	// Implementation signature
	protected validatePhone(
		message: string = 'Invalid phone number',
		optionsData?: {
			required?: boolean;
		},
	): z.ZodType<string | TEmpty> {
		const options = {
			required: true,
			...optionsData,
		};

		const baseSchema = z
			.string({ message })
			.trim()
			.refine((val) => this.isValidPhoneNumber(val), { message });

		if (options.required) {
			return this.coerceEmpty(baseSchema) as z.ZodType<string>;
		}

		const optionalSchema = baseSchema
			.transform((val) => (val === '' ? undefined : val))
			.optional();

		return this.coerceEmpty(optionalSchema) as z.ZodType<string | TEmpty>;
	}
}
