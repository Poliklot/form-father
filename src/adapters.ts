import { registerValidator, type ValidatorFieldElement, type ValidatorResult } from './validators';

type MaybePromise<T> = T | Promise<T>;

export type SchemaParseResult =
	| { success: true; data?: unknown }
	| { success: false; error?: unknown; issues?: Array<{ message?: string }> };

export type SchemaLike =
	| {
			safeParse?: (value: unknown) => MaybePromise<SchemaParseResult>;
			parse?: (value: unknown) => MaybePromise<unknown>;
	  }
	| ((value: unknown) => MaybePromise<boolean | ValidatorResult | void>);

export type AdapterValidator = (
	value: string,
	$input: ValidatorFieldElement,
	$form: HTMLElement,
	params?: any,
) => MaybePromise<boolean | ValidatorResult>;

export interface SchemaValidatorOptions {
	message?: string | ((error: unknown) => string);
	mapValue?: (value: string, $input: ValidatorFieldElement, $form: HTMLElement, params?: any) => unknown;
}

export interface RegisterSchemaValidatorOptions extends SchemaValidatorOptions {
	override?: boolean;
}

export interface RegisterFieldValidatorOptions {
	override?: boolean;
}

export interface LengthValidatorOptions {
	min?: number;
	max?: number;
	trim?: boolean;
	emptyIsValid?: boolean;
}

function readFirstIssueMessage(error: unknown): string | undefined {
	if (!error || typeof error !== 'object') return undefined;

	const issues = (error as any).issues || (error as any).errors;
	if (Array.isArray(issues)) {
		const firstMessage = issues.find(issue => typeof issue?.message === 'string')?.message;
		if (firstMessage) return firstMessage;
	}

	return typeof (error as any).message === 'string' ? (error as any).message : undefined;
}

function resolveMessage(error: unknown, message?: SchemaValidatorOptions['message']): string | undefined {
	if (typeof message === 'function') return message(error);
	return message || readFirstIssueMessage(error);
}

function normalizeResult(result: boolean | ValidatorResult | void, message?: string): boolean | ValidatorResult {
	if (typeof result === 'object' && result !== null) return result;
	if (result === undefined) return true;
	return result ? true : { valid: false, message };
}

export function createSchemaValidator(schema: SchemaLike, options: SchemaValidatorOptions = {}): AdapterValidator {
	return async (value, $input, $form, params) => {
		const mappedValue = options.mapValue ? options.mapValue(value, $input, $form, params) : value;

		try {
			if (typeof schema === 'function') {
				return normalizeResult(await schema(mappedValue), resolveMessage(undefined, options.message));
			}

			if (typeof schema.safeParse === 'function') {
				const result = await schema.safeParse(mappedValue);
				if (result.success) return true;
				return { valid: false, message: resolveMessage(result.error || result, options.message) };
			}

			if (typeof schema.parse === 'function') {
				await schema.parse(mappedValue);
				return true;
			}
		} catch (error) {
			return { valid: false, message: resolveMessage(error, options.message) };
		}

		return { valid: false, message: resolveMessage(undefined, options.message) };
	};
}

export function registerSchemaValidator(
	name: string,
	schema: SchemaLike,
	defaultMessage: string,
	options: RegisterSchemaValidatorOptions = {},
): void {
	const { override, ...adapterOptions } = options;
	registerValidator(name, createSchemaValidator(schema, adapterOptions), defaultMessage, { override });
}

export function registerFieldValidator(
	name: string,
	predicate: (value: string, $input: ValidatorFieldElement, $form: HTMLElement, params?: any) => MaybePromise<boolean>,
	defaultMessage: string,
	options: RegisterFieldValidatorOptions = {},
): void {
	registerValidator(name, createFieldValidator(predicate), defaultMessage, options);
}

export function createFieldValidator(
	predicate: (value: string, $input: ValidatorFieldElement, $form: HTMLElement, params?: any) => MaybePromise<boolean>,
	message?: string,
): AdapterValidator {
	return async (value, $input, $form, params) => {
		const valid = await predicate(value, $input, $form, params);
		return valid ? true : { valid: false, message };
	};
}

export function createPatternValidator(pattern: RegExp, message?: string): AdapterValidator {
	return createFieldValidator(value => {
		pattern.lastIndex = 0;
		return pattern.test(value);
	}, message);
}

export function createLengthValidator(options: LengthValidatorOptions, message?: string): AdapterValidator {
	return createFieldValidator(value => {
		const normalizedValue = options.trim === false ? value : value.trim();
		if (normalizedValue.length === 0 && options.emptyIsValid === true) return true;
		if (typeof options.min === 'number' && normalizedValue.length < options.min) return false;
		if (typeof options.max === 'number' && normalizedValue.length > options.max) return false;
		return true;
	}, message);
}
