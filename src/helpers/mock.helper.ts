import type { z } from 'zod';

export type ValidatorInput<V, K extends keyof V> = V[K] extends z.ZodTypeAny
	? z.input<V[K]>
	: V[K] extends (...args: unknown[]) => z.ZodTypeAny
		? z.input<ReturnType<V[K]>>
		: never;

export type ValidatorOutput<V, K extends keyof V> = V[K] extends z.ZodTypeAny
	? z.output<V[K]>
	: V[K] extends (...args: unknown[]) => z.ZodTypeAny
		? z.output<ReturnType<V[K]>>
		: never;

export type ValidatorShape = 'input' | 'output';

export type ValidatorByShape<
	TValidator extends Record<string, z.ZodTypeAny>,
	K extends keyof TValidator,
	S extends ValidatorShape,
> = S extends 'input' ? z.input<TValidator[K]> : z.output<TValidator[K]>;

// export type ValidatorPayloads<
// 	TValidator extends Record<string, z.ZodTypeAny>,
// 	K extends keyof TValidator,
// 	S extends ValidatorShape = 'input',
// > = {
// 	[P in K]: ValidatorByShape<TValidator, P, S>;
// };

// export function createValidatorPayloads<
// 	TValidator extends Record<string, z.ZodTypeAny>,
// 	K extends keyof TValidator,
// 	S extends ValidatorShape = 'input',
// >(
// 	payloads: ValidatorPayloads<TValidator, K, S>
// ): {
// 	payloads: ValidatorPayloads<TValidator, K, S>;
// 	get: <T extends K>(schema: T) => ValidatorByShape<TValidator, T, S>;
// } {
// 	return {
// 		payloads,
// 		get: <T extends K>(schema: T): ValidatorByShape<TValidator, T, S> => {
// 			const payload = payloads[schema];
//
// 			if (!payload) {
// 				throw new Error(`No payload for schema: ${String(schema)}`);
// 			}
//
// 			return payload as ValidatorByShape<TValidator, T, S>;
// 		},
// 	};
// }
