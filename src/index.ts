import {
	serializeToFormData,
	isEmailValid,
	isUrlValid,
	parseCommonResponseProperties,
	closest,
	isPhoneValid,
	serializeFormToJSON,
} from './helpers';
import { getValidator } from './validators';

export * from './validators';
export * from './adapters';
export {
	serializeToFormData,
	isEmailValid,
	isUrlValid,
	parseCommonResponseProperties,
	closest,
	isPhoneValid,
	blockScrollBody,
	unblockScrollBody,
	serializeFormToJSON,
} from './helpers';

// --- shared cross-file state (singleton via globalThis) ---
const FORM_GLOBAL_KEY = Symbol.for('formfather.shared');

type SharedState = {
	defaultParams: Partial<FormOptions>;
	defaultValidationSchema?: ValidationSchema;
};

const __shared: SharedState =
	// уже существует? используем его
	(globalThis as any)[FORM_GLOBAL_KEY] ??
	// иначе создаём
	((globalThis as any)[FORM_GLOBAL_KEY] = {
		defaultParams: {},
		defaultValidationSchema: undefined,
	});

export type ValidationRule = string | { rule: string; params?: any };
export type ValidationTrigger = 'submit' | 'input' | 'blur' | 'change';
export type ValidationErrorSource = 'client' | 'server' | 'manual';
export type FieldReference = string | FormFieldElement;

export const FORM_ERROR_FIELD = '_form';

export interface ValidationError {
	field: string;
	rule: string;
	message: string;
	source: ValidationErrorSource;
}

export interface SubmitResult {
	success: boolean;
	response?: Response;
	responseBody?: ResponseBody;
	error?: unknown;
}

export interface FormResetOptions {
	clearErrors?: boolean;
}

export interface ValidationIssue {
	field?: string;
	rule?: string;
	message: string;
	source?: ValidationErrorSource;
}

export type ValidationIssueInput =
	| string
	| ValidationIssue
	| ErrorResponse
	| Record<string, string>
	| Array<string | ValidationIssue | ErrorResponse>;

export interface FormValidatorContext {
	form: Form;
	formElement: HTMLFormElement;
	values: Record<string, any>;
	errors: ValidationError[];
}

export type FormValidatorResult =
	| boolean
	| string
	| void
	| ValidationIssue
	| Array<string | ValidationIssue>;

export type FormValidator = (context: FormValidatorContext) => FormValidatorResult | Promise<FormValidatorResult>;

export type FormValidatorPredicate = (context: FormValidatorContext) => boolean | Promise<boolean>;
export type FormValidatorIssueFactory =
	| string
	| ValidationIssue
	| ((context: FormValidatorContext) => string | ValidationIssue | Promise<string | ValidationIssue>);

export type ValidationSchema = Record<
	string,
	{
		rules: ValidationRule[];
		selector?: string;
		messages?: Record<string, string>;
	}
>;

function readFormValue(values: Record<string, any>, field: string): any {
	return values[field];
}

function isEmptyFormValue(value: any): boolean {
	if (Array.isArray(value)) return value.length === 0;
	return value === undefined || value === null || String(value).trim().length === 0;
}

async function resolveFormValidatorIssue(
	context: FormValidatorContext,
	issue: FormValidatorIssueFactory,
	fallbackField?: string,
	fallbackRule?: string,
): Promise<string | ValidationIssue> {
	const resolvedIssue = typeof issue === 'function' ? await issue(context) : issue;
	if (typeof resolvedIssue === 'string') {
		return {
			field: fallbackField,
			rule: fallbackRule,
			message: resolvedIssue,
		};
	}

	return {
		field: fallbackField,
		rule: fallbackRule,
		...resolvedIssue,
	};
}

export function createFormValidator(
	predicate: FormValidatorPredicate,
	issue: FormValidatorIssueFactory,
): FormValidator {
	return async context => {
		const valid = await predicate(context);
		return valid ? true : resolveFormValidatorIssue(context, issue);
	};
}

export function sameAsField(
	field: string,
	otherField: string,
	message: string = 'Значения не совпадают',
	rule: string = 'same-as-field',
): FormValidator {
	return createFormValidator(
		({ values }) => readFormValue(values, field) === readFormValue(values, otherField),
		{ field, rule, message },
	);
}

export function requiredIf(
	field: string,
	condition: FormValidatorPredicate,
	message: string = 'Поле обязательно',
	rule: string = 'conditional-required',
): FormValidator {
	return createFormValidator(
		async context => !(await condition(context)) || !isEmptyFormValue(readFormValue(context.values, field)),
		{ field, rule, message },
	);
}

export function dateOrder(
	startField: string,
	endField: string,
	message: string = 'Дата окончания должна быть позже даты начала',
	rule: string = 'date-order',
): FormValidator {
	return createFormValidator(
		({ values }) => {
			const start = readFormValue(values, startField);
			const end = readFormValue(values, endField);
			if (isEmptyFormValue(start) || isEmptyFormValue(end)) return true;
			return Date.parse(String(start)) <= Date.parse(String(end));
		},
		{ field: endField, rule, message },
	);
}

type SubmitElement = HTMLInputElement | HTMLButtonElement;
export type FormFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

let loaderIdCounter = 0;
const FORM_INSTANCES = new WeakMap<HTMLFormElement, Form>();

/** Параметры формы. */
export interface FormOptions {
	/**
	 * Функция обратного вызова. Запускается, перед началом валидации формы.
	 *
	 * @param formInstance - Инстанс формы.
	 */
	onBeforeValidate?: (formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается, когда закончилась валидация, но не началась отправка.
	 *
	 * @param isValid - Статус валидации.
	 * @param formInstance - Инстанс формы.
	 */
	onAfterValidate?: (isValid: boolean, formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается после неуспешной клиентской валидации.
	 *
	 * @param errors - Список ошибок валидации.
	 * @param formInstance - Инстанс формы.
	 */
	onValidationError?: (errors: ValidationError[], formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается перед отправкой уже валидной формы. Если вернуть `false`, отправка будет
	 * отменена.
	 *
	 * @param formInstance - Инстанс формы.
	 */
	onBeforeSubmit?: (formInstance: Form) => void | boolean | Promise<void | boolean>;

	/**
	 * Функция обратного вызова. Запускается, когда форма отправляется.
	 *
	 * @param formInstance - Инстанс формы.
	 */
	onSubmit?: (formInstance: Form) => void;

	/**
	 * Функция обратного вызова.
	 *
	 * @param responseBody - Тело ответа.
	 * @param formInstance - Инстанс формы.
	 */
	onResponse?: (responseBody: ResponseBody, formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается после успешного HTTP-ответа и `success: true`.
	 *
	 * @param responseBody - Тело ответа.
	 * @param formInstance - Инстанс формы.
	 */
	onResponseSuccess?: (responseBody: ResponseBody, formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается после неуспешного HTTP-ответа или `success !== true`.
	 *
	 * @param responseBody - Тело ответа.
	 * @param formInstance - Инстанс формы.
	 */
	onResponseUnsuccess?: (responseBody: ResponseBody, formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается при исключении во время отправки формы.
	 *
	 * @param error - Ошибка отправки.
	 * @param formInstance - Инстанс формы.
	 */
	onSubmitError?: (error: unknown, formInstance: Form) => void;

	/** Нужно ли показывать loader в кнопке. По умолчанию `true`. */
	showLoaderButton?: boolean;

	/** Нужно ли проскроливать до первого по порядку элемента с ошибкой. По умолчанию `true`. */
	scrollToFirstErroredInput?: boolean;

	/** Нужно ли переводить фокус в первое ошибочное поле. По умолчанию `false`. */
	focusFirstErroredInput?: boolean;

	/** Кастомный тип ошибки. */
	customTypeError?: any;

	/** Цвет лоадера. */
	loaderColor?: string;

	/** Нужно ли выводить данные в консоль. По умолчанию `false`. */
	logging?: boolean;

	/** Селектор поля ввода данных. Таких как textarea, input, select, ... . По умолчанию `.input`. */
	inputSelector?: string;

	/**
	 * Селектор поля обёртки над полем ввода, у которого реализован публичный метод `showError`. По умолчанию
	 * `.input-primary`.
	 */
	inputWrapperSelector?: string;

	/**
	 * События, на которых нужно запускать валидацию поля. `submit` всегда обрабатывается отдельно. По умолчанию
	 * `submit`.
	 */
	validateOn?: ValidationTrigger | ValidationTrigger[];

	/** События, на которых нужно повторно проверять уже ошибочные поля. По умолчанию `input` и `change`. */
	revalidateOn?: ValidationTrigger | ValidationTrigger[];

	/** Задержка live-валидации в миллисекундах. По умолчанию `0`. */
	validationDebounce?: number;

	/** Атрибут с CSS-селектором контейнера для ошибки поля. По умолчанию `data-error-container`. */
	errorContainerAttribute?: string;

	/** Атрибут, куда пишется состояние поля: `validating`, `valid` или `invalid`. */
	validationStateAttribute?: string;

	/** Следить за динамически добавленными/удалёнными полями и submit-кнопками. По умолчанию `false`. */
	observeMutations?: boolean;

	/** Функция для обёртки отправляемых данных. */
	wrapData?: (data: Record<string, any>) => Record<string, any>;

	/** Схема валидации: поле → массив правил + override-сообщения */
	validationSchema?: ValidationSchema;

	/** Валидаторы всей формы: cross-field, conditional required, date ranges и другие проверки над `getValues()`. */
	formValidators?: FormValidator | FormValidator[];
}

export interface ErrorResponse {
	name: string;
	'error-msg': string;
}

export interface ResponseBody {
	[key: string]: any;
	success?: boolean;
	error?: boolean;
	'error-msg'?: string;
	errors?: ErrorResponse[];
}

/** Изначальная дефолтная схема. */
const INITIAL_DEFAULT_SCHEMA: ValidationSchema = {
	tel: {
		selector: 'input[type="tel"]',
		rules: ['tel'],
	},
	email: {
		selector: 'input[type="email"]',
		rules: ['email'],
	},
	required: {
		selector: '[required]',
		rules: ['required'],
	},
	url: {
		selector: 'input[type="url"]',
		rules: ['url'],
	},
	'not-numbers': {
		selector: 'input[data-validate="not-numbers"]',
		rules: ['not-numbers'],
	},
};

/**
 * Реализует форму отправки данных.
 *
 * @class
 */
export default class Form {
	public $el: HTMLFormElement;
	private options: FormOptions;
	private config: FormOptions;
	private $submits: SubmitElement[] = [];
	private waitResponse: boolean = false;
	private inputs: NodeListOf<FormFieldElement> | null = null;
	private _onSubmitHandler?: (e: Event) => void | Promise<void>;
	private _onSubmitClickHandler?: (e: Event) => void | Promise<void>;
	private fieldEventHandlers: Array<{
		$input: FormFieldElement;
		event: Exclude<ValidationTrigger, 'submit'>;
		handler: EventListener;
	}> = [];
	private liveValidationTimers = new WeakMap<FormFieldElement, ReturnType<typeof setTimeout>>();
	private fieldValidationTokens = new WeakMap<FormFieldElement, number>();
	private fieldValidationTokenCounter = 0;
	private mutationObserver?: MutationObserver;
	private errors: ValidationError[] = [];

	private static get defaultParams(): Partial<FormOptions> {
		return __shared.defaultParams;
	}
	private static set defaultParams(v: Partial<FormOptions>) {
		__shared.defaultParams = v;
	}

	static get defaultValidationSchema(): ValidationSchema {
		return (__shared.defaultValidationSchema ??= INITIAL_DEFAULT_SCHEMA);
	}

	static set defaultValidationSchema(v: ValidationSchema) {
		__shared.defaultValidationSchema = v;
	}

	/**
	 * Создать форму.
	 *
	 * @param {HTMLElement} $el - Элемент формы (тег form!).
	 * @param {Object} options - Параметры формы.
	 */
	constructor($el: HTMLElement, options: FormOptions = {}) {
		this.$el = $el as HTMLFormElement;
		this.options = options;

		const defaultConfig: FormOptions = {
			onSubmit: () => {},
			onResponse: () => {},
			onResponseSuccess: () => {},
			onResponseUnsuccess: () => {},
			customTypeError: null,
			loaderColor: '#fff',
			showLoaderButton: true,
			scrollToFirstErroredInput: true,
			focusFirstErroredInput: false,
			logging: false,
			inputSelector: '.input',
			inputWrapperSelector: '.input-primary',
			validateOn: 'submit',
			revalidateOn: ['input', 'change'],
			validationDebounce: 0,
			errorContainerAttribute: 'data-error-container',
			validationStateAttribute: 'data-form-father-state',
			observeMutations: false,
		};

		/* Слияние параметров: глобальные параметры → пользовательские параметры */
		this.config = Object.assign({}, defaultConfig, Form.defaultParams, options);

		if (this.$el) {
			this.$submits = this.findSubmitElements();
			if (this.isCorrectArguments()) {
				this.bindSubmitHandlers();
				this.initialization();
				this.bindFieldValidationEvents();
				this.setupMutationObserver();
				FORM_INSTANCES.set(this.$el, this);
			}
		} else {
			console.warn('Empty $el');
		}
	}

	public getOptions(): FormOptions {
		return this.options;
	}

	/**
	 * Инициализирует сразу несколько форм по CSS-селектору. Если форма уже инициализирована, её настройки обновятся.
	 *
	 * @param selector - CSS-селектор форм. По умолчанию `form[data-form-father]`.
	 * @param options - Общие параметры для найденных форм.
	 */
	public static initAll(selector: string = 'form[data-form-father]', options: FormOptions = {}): Form[] {
		/* istanbul ignore next -- SSR guard: jsdom does not allow document to be unset cleanly. */
		if (typeof document === 'undefined') return [];

		return Array.from(document.querySelectorAll<HTMLFormElement>(selector))
			.filter($form => $form.tagName === 'FORM')
			.map($form => {
				const existing = FORM_INSTANCES.get($form);
				if (existing) {
					existing.updateOptions(options);
					return existing;
				}

				return new Form($form, options);
			});
	}

	/** Обновляет настройки конкретного инстанса формы без пересоздания обработчиков вручную. */
	public updateOptions(options: Partial<FormOptions>): this {
		this.options = { ...this.options, ...options };
		this.config = { ...this.config, ...options };
		this.refreshControls();
		this.bindSubmitHandlers();
		this.bindFieldValidationEvents();
		this.setupMutationObserver();
		return this;
	}

	/** Возвращает текущий список ошибок формы. */
	public getErrors(): ValidationError[] {
		return this.errors.map(error => ({ ...error }));
	}

	/** Возвращает значения формы обычным объектом. */
	public getValues(): Record<string, any> {
		return serializeFormToJSON(this.$el);
	}

	private normalizeValueList(value: any): string[] {
		return Array.isArray(value) ? value.map(String) : [String(value)];
	}

	/** Проставляет значения полей по `name` и уведомляет UI через `input`/`change` события. */
	public setValues(values: Record<string, any>): this {
		this.getAllFields().forEach($field => {
			if (!$field.name || !Object.prototype.hasOwnProperty.call(values, $field.name)) return;

			const value = values[$field.name];
			if ($field instanceof HTMLInputElement && $field.type === 'file') return;

			if ($field instanceof HTMLInputElement && $field.type === 'checkbox') {
				if (typeof value === 'boolean') {
					$field.checked = value;
				} else {
					$field.checked = this.normalizeValueList(value).includes($field.value);
				}
			} else if ($field instanceof HTMLInputElement && $field.type === 'radio') {
				$field.checked = String(value) === $field.value;
			} else if ($field instanceof HTMLSelectElement && $field.multiple) {
				const valuesList = this.normalizeValueList(value);
				Array.from($field.options).forEach(option => {
					option.selected = valuesList.includes(option.value);
				});
			} else {
				$field.value = value == null ? '' : String(value);
			}

			$field.dispatchEvent(new Event('input', { bubbles: true }));
			$field.dispatchEvent(new Event('change', { bubbles: true }));
		});

		return this;
	}

	/** Снимает все клиентские и серверные ошибки с формы, не меняя значения полей. */
	public clearErrors(): this {
		this.errors = [];
		this.getAllFields().forEach($field => {
			this.hideError($field);
			this.clearFieldValidationState($field);
		});
		this.hideErrorForm();
		return this;
	}

	private isErrorResponse(issue: unknown): issue is ErrorResponse {
		return (
			!!issue &&
			typeof issue === 'object' &&
			typeof (issue as ErrorResponse).name === 'string' &&
			typeof (issue as ErrorResponse)['error-msg'] === 'string'
		);
	}

	private normalizeValidationIssues(
		issues: ValidationIssueInput | FormValidatorResult,
		source: ValidationErrorSource,
	): ValidationIssue[] {
		if (issues == null || issues === true) return [];
		if (issues === false) return [{ message: 'Некорректные данные формы', source }];
		if (typeof issues === 'string') return [{ message: issues, source }];

		if (Array.isArray(issues)) {
			return issues.flatMap(issue => this.normalizeValidationIssues(issue, source));
		}

		if (this.isErrorResponse(issues)) {
			return [
				{
					field: issues.name,
					rule: source,
					message: issues['error-msg'],
					source,
				},
			];
		}

		if (typeof issues === 'object' && 'message' in issues && typeof (issues as ValidationIssue).message === 'string') {
			return [{ ...(issues as ValidationIssue), source: (issues as ValidationIssue).source || source }];
		}

		if (typeof issues === 'object') {
			return Object.entries(issues as Record<string, string>).map(([field, message]) => ({
				field,
				rule: source,
				message,
				source,
			}));
		}

		return [];
	}

	private applyValidationIssue(issue: ValidationIssue, source: ValidationErrorSource): FormFieldElement | null {
		const issueSource = issue.source || source;
		const rule = issue.rule || issueSource;
		const field = issue.field || FORM_ERROR_FIELD;

		if (field === FORM_ERROR_FIELD) {
			this.setErrorRecord(FORM_ERROR_FIELD, rule, issue.message, issueSource);
			this.showErrorForm(issue.message);
			return null;
		}

		const $field = this.findFieldByName(field);
		if (!$field) {
			this.setErrorRecord(field, rule, issue.message, issueSource);
			console.warn(`Не найдено поле с именем: ${field}, для вывода ошибки: ${issue.message}`);
			return null;
		}

		this.showFieldError($field, issue.message, issueSource, rule);
		return $field;
	}

	/** Показывает несколько ошибок формы или полей: из backend map/array, `ErrorResponse[]` или form validators. */
	public setErrors(issues: ValidationIssueInput, source: ValidationErrorSource = 'server'): this {
		this.normalizeValidationIssues(issues, source).forEach(issue => {
			this.applyValidationIssue(issue, source);
		});
		return this;
	}

	private async validateFormValidators(): Promise<{ ok: boolean; erroredInputs: FormFieldElement[] }> {
		const validators = this.config.formValidators
			? Array.isArray(this.config.formValidators)
				? this.config.formValidators
				: [this.config.formValidators]
			: [];
		const erroredInputs: FormFieldElement[] = [];
		let ok = true;

		for (const validator of validators) {
			const result = await validator({
				form: this,
				formElement: this.$el,
				values: this.getValues(),
				errors: this.getErrors(),
			});
			const issues = this.normalizeValidationIssues(result, 'client');
			if (issues.length === 0) continue;

			ok = false;
			issues.forEach(issue => {
				const $field = this.applyValidationIssue(issue, 'client');
				if ($field) erroredInputs.push($field);
			});
		}

		return { ok, erroredInputs };
	}

	/** Сбрасывает форму через native `reset()` и опционально очищает ошибки. */
	public reset(options: FormResetOptions = {}): this {
		this.$el.reset();
		this.refreshControls();

		if (options.clearErrors !== false) {
			this.clearErrors();
		}

		return this;
	}

	/**
	 * Обновляет параметры по умолчанию для настроек формы. Метод объединяет переданные параметры с уже существующими
	 * параметрами по умолчанию.
	 *
	 * @param {Partial<FormOptions>} params - Объект, содержащий новые значения параметров. Можно передать только те
	 *   свойства, которые необходимо обновить; остальные сохранятся без изменений.
	 */
	public static setDefaultParams(params: Partial<FormOptions>) {
		this.defaultParams = { ...this.defaultParams, ...params };
	}

	private refreshControls(): void {
		this.inputs = this.$el.querySelectorAll(this.config.inputSelector!) as NodeListOf<FormFieldElement>;
	}

	private findSubmitElements(): SubmitElement[] {
		return Array.from(
			this.$el.querySelectorAll('input[type="submit"], input[type="image"], button[type="submit"], button:not([type])'),
		) as SubmitElement[];
	}

	private bindSubmitHandlers(): void {
		if (!this._onSubmitClickHandler) {
			this._onSubmitClickHandler = async (e: Event) => {
				await this.handleSubmitEvent(e);
			};
		}

		this.$submits.forEach($submit => {
			$submit.removeEventListener('click', this._onSubmitClickHandler as EventListener);
		});

		this.$submits = this.findSubmitElements();
		this.$submits.forEach($submit => {
			$submit.addEventListener('click', this._onSubmitClickHandler as EventListener);
		});
	}

	private initialization() {
		this.refreshControls();

		this._onSubmitHandler = async (e: Event) => {
			await this.handleSubmitEvent(e);
		};
		this.$el.addEventListener('submit', this._onSubmitHandler as EventListener);
	}

	private async handleSubmitEvent(e: Event): Promise<SubmitResult | undefined> {
		e.preventDefault();
		this.config.onBeforeValidate?.(this);

		const isValid = await this.validate();

		this.config.onAfterValidate?.(isValid, this);

		if (!isValid) {
			this.config.onValidationError?.(this.getErrors(), this);
			return {
				success: false,
				error: this.getErrors(),
			};
		}

		return this.submit();
	}

	private normalizeTriggers(
		value: ValidationTrigger | ValidationTrigger[] | undefined,
		fallback: ValidationTrigger[],
	): ValidationTrigger[] {
		const triggers = value == null ? fallback : Array.isArray(value) ? value : [value];
		return Array.from(new Set(triggers));
	}

	private clearFieldValidationEvents(): void {
		this.fieldEventHandlers.forEach(({ $input, event, handler }) => {
			$input.removeEventListener(event, handler);
		});
		this.fieldEventHandlers = [];
	}

	private bindFieldValidationEvents(): void {
		this.clearFieldValidationEvents();

		const validateOn = this.normalizeTriggers(this.config.validateOn, ['submit']).filter(
			(event): event is Exclude<ValidationTrigger, 'submit'> => event !== 'submit',
		);
		const revalidateOn = this.normalizeTriggers(this.config.revalidateOn, ['input', 'change']).filter(
			(event): event is Exclude<ValidationTrigger, 'submit'> => event !== 'submit',
		);
		const events = Array.from(new Set([...validateOn, ...revalidateOn]));
		if (events.length === 0) return;

		const fields = this.getAllFields();
		fields.forEach($input => {
			events.forEach(event => {
				const handler: EventListener = () => {
					const shouldValidate = validateOn.includes(event) || this.hasFieldError($input);
					if (shouldValidate) this.scheduleFieldValidation($input);
				};

				$input.addEventListener(event, handler);
				this.fieldEventHandlers.push({ $input, event, handler });
			});
		});
	}

	private scheduleFieldValidation($input: FormFieldElement): void {
		const currentTimer = this.liveValidationTimers.get($input);
		if (currentTimer) clearTimeout(currentTimer);

		const delay = Math.max(0, Number(this.config.validationDebounce) || 0);
		const run = () => {
			void this.validateField($input);
		};

		if (delay === 0) {
			run();
			return;
		}

		const timer = setTimeout(run, delay);
		this.liveValidationTimers.set($input, timer);
	}

	private setupMutationObserver(): void {
		this.mutationObserver?.disconnect();
		this.mutationObserver = undefined;

		if (!this.config.observeMutations || typeof MutationObserver === 'undefined') return;

		this.mutationObserver = new MutationObserver(() => {
			this.refreshControls();
			this.bindSubmitHandlers();
			this.bindFieldValidationEvents();
		});
		this.mutationObserver.observe(this.$el, {
			childList: true,
			subtree: true,
		});
	}

	private getErrorContainer($input: FormFieldElement): HTMLElement | null {
		const attrName = this.config.errorContainerAttribute || 'data-error-container';
		const selector = $input.getAttribute(attrName);
		if (!selector) return null;

		try {
			return document.querySelector(selector) as HTMLElement | null;
		} catch {
			console.warn(`[FormFather] Invalid error container selector "${selector}"`);
			return null;
		}
	}

	/**
	 * Показывает ошибку для поля ввода.
	 *
	 * @param {HTMLInputElement} $input - Поле ввода.
	 * @param {String} text - Текст ошибки.
	 */
	private showError($input: FormFieldElement, text: string) {
		$input.setAttribute('aria-invalid', 'true');

		const $errorContainer = this.getErrorContainer($input);
		if ($errorContainer) {
			$errorContainer.textContent = text;
			if (!$errorContainer.hasAttribute('role')) $errorContainer.setAttribute('role', 'alert');
			$errorContainer.removeAttribute('hidden');
			return;
		}

		const $inputWrapper = closest($input, this.config.inputWrapperSelector!);
		if (!$inputWrapper) {
			console.warn(`Не найдена обёртка для поля с именем: ${$input.name || $input.type}`);
			return;
		}

		const customShowError = ($inputWrapper as any).showError;
		if (typeof customShowError === 'function') {
			customShowError.call($inputWrapper, text);
			return;
		}

		$inputWrapper.classList.add('input__wrapper--error');

		let $error = $inputWrapper.querySelector('[data-form-father-error]') as HTMLElement | null;
		if (!$error) {
			$error = document.createElement('div');
			$error.setAttribute('data-form-father-error', '');
			$error.setAttribute('role', 'alert');
			$input.insertAdjacentElement('afterend', $error);
		}
		$error.textContent = text;
	}

	/** Показывает лоадер */
	private showLoader() {
		this.$submits.forEach($submit => {
			$submit.classList.add('button--loading');

			if ($submit.querySelector('.button__loader')) return;

			const gradientId = `form-father-loader-${loaderIdCounter++}`;
			const loaderSvg = `
				<svg height="38" viewBox="0 0 38 38" width="38" xmlns="http://www.w3.org/2000/svg">
					<defs>
					<linearGradient id="${gradientId}" x1="8.042%" x2="65.682%" y1="0%" y2="23.865%">
						<stop offset="0%" stop-color="${this.config.loaderColor}" stop-opacity="0"/>
						<stop offset="63.146%" stop-color="${this.config.loaderColor}" stop-opacity=".631"/>
						<stop offset="100%" stop-color="${this.config.loaderColor}"/>
					</linearGradient>
					</defs>
					<g fill-rule="evenodd" fill="none">
					<g transform="translate(1 1)">
						<path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke-width="5" stroke="url(#${gradientId})"></path>
						<circle cx="36" cy="18" fill="${this.config.loaderColor}" r="1"></circle>
					</g>
					</g>
				</svg>
			`;

			const $loaderEl = document.createElement('span');
			$loaderEl.innerHTML = loaderSvg;
			$loaderEl.className = 'button__loader';
			$submit.insertAdjacentElement('afterbegin', $loaderEl);
			requestAnimationFrame(() => {
				$loaderEl.setAttribute('data-showed', '');
			});
		});
	}

	/** Скрывает лоадер */
	private hideLoader() {
		this.$submits.forEach($submit => {
			$submit.classList.remove('button--loading');
			const $loader = $submit.querySelector('.button__loader') as HTMLElement | null;
			if ($loader) {
				$loader.classList.remove('active');
				$loader.removeAttribute('data-showed');
				setTimeout(() => {
					$loader.remove();
				}, 250);
			}
		});
	}

	/**
	 * Скрывает ошибку.
	 *
	 * @param {HTMLInputElement} $input - Поле ввода.
	 */
	private hideError($input: FormFieldElement) {
		const $inputWrapper = closest($input, this.config.inputWrapperSelector!) || $input.parentElement;
		const $errorContainer = this.getErrorContainer($input);

		$input.removeAttribute('aria-invalid');
		if ($errorContainer) {
			$errorContainer.textContent = '';
			$errorContainer.setAttribute('hidden', '');
		}
		$inputWrapper?.querySelector('[data-form-father-error]')?.remove();
		$inputWrapper?.classList.remove('input__wrapper--error');

		if ($inputWrapper && $inputWrapper.classList.contains('input__wrapper')) {
			const dataTypeError = $inputWrapper.getAttribute('data-type-error') || 'default';

			if (dataTypeError === 'default') {
				// Init error elements
				// const { $inputErrorIcon, $inputErrorBadge } = this.initErrorElements($inputWrapper, dataTypeError);
			}
		}
	}

	/**
	 * Проскроливает до первого ошибочного поля.
	 *
	 * @param {HTMLElement[]} inputsList - Массив элементов с ошибкой.
	 */
	private scrollToFirstErroredInput(inputsList: HTMLElement[]) {
		if (inputsList.length > 0) {
			const allInputInFormList = Array.from(this.$el.querySelectorAll('input, textarea, select'));
			let $firstInputOnForm: HTMLElement | null = null;
			let minIndex = Infinity;

			inputsList.forEach($input => {
				const findIndex = allInputInFormList.findIndex($item => $item === $input);
				if (findIndex < minIndex) {
					minIndex = findIndex;
					$firstInputOnForm = $input;
				}
			});

			if ($firstInputOnForm) {
				const rect = ($firstInputOnForm as HTMLElement).getBoundingClientRect();
				const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
				const scrollTargetY = rect.top + scrollTop - window.innerHeight / 2;

				document.documentElement.setAttribute('data-now-scrolling', '');

				window.scrollTo({
					top: scrollTargetY,
					behavior: 'smooth',
				});

				setTimeout(() => {
					document.documentElement.removeAttribute('data-now-scrolling');
				}, 800);
			}
		}
	}

	private focusFirstErroredInput(inputsList: HTMLElement[]) {
		if (inputsList.length === 0) return;

		const allInputInFormList = Array.from(this.$el.querySelectorAll('input, textarea, select'));
		const $firstInputOnForm = inputsList
			.slice()
			.sort((a, b) => allInputInFormList.indexOf(a) - allInputInFormList.indexOf(b))[0] as HTMLElement | undefined;

		$firstInputOnForm?.focus?.({ preventScroll: true });
	}

	private getValidationSchema(): ValidationSchema {
		return {
			...(Form.defaultValidationSchema || {}),
			...(this.config.validationSchema || {}),
		};
	}

	private getAllFields($block: HTMLElement = this.$el): FormFieldElement[] {
		return Array.from($block.querySelectorAll<FormFieldElement>('input, textarea, select'));
	}

	private getFieldKey($input: FormFieldElement): string {
		return $input.name || $input.id || $input.getAttribute('data-field') || $input.type || 'field';
	}

	private hasFieldError($input: FormFieldElement): boolean {
		const field = this.getFieldKey($input);
		return $input.getAttribute('aria-invalid') === 'true' || this.errors.some(error => error.field === field);
	}

	private clearFieldErrorRecord($input: FormFieldElement): void {
		const field = this.getFieldKey($input);
		this.errors = this.errors.filter(error => error.field !== field);
	}

	private setErrorRecord(field: string, rule: string, message: string, source: ValidationErrorSource): void {
		this.errors.push({
			field,
			rule,
			message,
			source,
		});
	}

	private getValidationStateAttribute(): string {
		return this.config.validationStateAttribute || 'data-form-father-state';
	}

	private setFieldValidationState($input: FormFieldElement, state: 'validating' | 'valid' | 'invalid' | null): void {
		const attr = this.getValidationStateAttribute();
		if (state) {
			$input.setAttribute(attr, state);
		} else {
			$input.removeAttribute(attr);
		}
	}

	private startFieldValidation($input: FormFieldElement): number {
		const token = ++this.fieldValidationTokenCounter;
		this.fieldValidationTokens.set($input, token);
		$input.setAttribute('aria-busy', 'true');
		this.setFieldValidationState($input, 'validating');
		return token;
	}

	private isLatestFieldValidation($input: FormFieldElement, token?: number): boolean {
		return token == null || this.fieldValidationTokens.get($input) === token;
	}

	private finishFieldValidation($input: FormFieldElement, token: number, isValid: boolean): void {
		if (!this.isLatestFieldValidation($input, token)) return;

		$input.removeAttribute('aria-busy');
		this.setFieldValidationState($input, isValid ? 'valid' : 'invalid');
	}

	private clearFieldValidationState($input: FormFieldElement): void {
		this.fieldValidationTokens.delete($input);
		$input.removeAttribute('aria-busy');
		this.setFieldValidationState($input, null);
	}

	private setValidationError(
		$input: FormFieldElement,
		rule: string,
		message: string,
		source: ValidationErrorSource,
	): void {
		this.clearFieldErrorRecord($input);
		this.setErrorRecord(this.getFieldKey($input), rule, message, source);
	}

	private resolveField(field: FieldReference): FormFieldElement | null {
		if (typeof field !== 'string') return field;
		return this.findFieldByName(field);
	}

	private parseRuleString(ruleString: string): ValidationRule {
		const [rule, ...params] = ruleString.split(':').map(s => s.trim());
		return params.length > 0 ? { rule, params: params.length === 1 ? params[0] : params } : rule;
	}

	private parseValidationAttribute(value: string | null): ValidationRule[] {
		return (value ?? '')
			.split(/[,\s|]+/)
			.map(s => s.trim())
			.filter(Boolean)
			.map(ruleString => this.parseRuleString(ruleString));
	}

	private getRuleName(rule: ValidationRule): string {
		return typeof rule === 'string' ? rule : rule.rule;
	}

	private getRuleIdentity(rule: ValidationRule): string {
		return JSON.stringify(rule);
	}

	private collectRules(
		$input: FormFieldElement,
		fromSchema: ValidationRule[] = [],
		schemaKeys: Set<string> = new Set(),
	): ValidationRule[] {
		const list: ValidationRule[] = [];

		if ($input.hasAttribute('required')) list.push('required');
		list.push(...fromSchema);

		const dataValidateRules = this.parseValidationAttribute($input.getAttribute('data-validate')).filter(rule => {
			const ruleName = this.getRuleName(rule);
			return getValidator(ruleName) || !schemaKeys.has(ruleName);
		});
		list.push(...dataValidateRules);
		list.push(...this.parseValidationAttribute($input.getAttribute('data-custom-validate')));

		const filtered: ValidationRule[] = [];
		const seen = new Set<string>();
		for (const rule of list) {
			const ruleName = this.getRuleName(rule);
			if (!getValidator(ruleName)) {
				console.warn(`[FormFather] Unknown validation rule "${ruleName}"`);
				continue;
			}

			const identity = this.getRuleIdentity(rule);
			if (seen.has(identity)) continue;
			seen.add(identity);
			filtered.push(rule);
		}

		return filtered;
	}

	private getRuleMessage(
		$input: FormFieldElement,
		rule: string,
		messages: Record<string, string>,
		defaultMessage: string,
		overrideMessage?: string,
	): string {
		const attrMessage = $input.getAttribute(`data-error-${rule}`);
		return overrideMessage || attrMessage || messages[rule] || defaultMessage;
	}

	private fieldMatchesSchemaDefinition(
		$input: FormFieldElement,
		key: string,
		def: ValidationSchema[string],
	): boolean {
		if (def.selector) {
			try {
				return $input.matches(def.selector);
			} catch {
				console.warn(`[FormFather] Invalid validation selector "${def.selector}"`);
				return false;
			}
		}

		return this.parseValidationAttribute($input.getAttribute('data-validate')).some(rule => this.getRuleName(rule) === key);
	}

	private getFieldValidationConfig(
		$input: FormFieldElement,
		schema: ValidationSchema = this.getValidationSchema(),
	): { rules: ValidationRule[]; messages: Record<string, string> } {
		const rules: ValidationRule[] = [];
		const messages: Record<string, string> = {};

		for (const [key, def] of Object.entries(schema)) {
			if (!this.fieldMatchesSchemaDefinition($input, key, def)) continue;
			rules.push(...def.rules);
			Object.assign(messages, def.messages || {});
		}

		return {
			rules: this.collectRules($input, rules, new Set(Object.keys(schema))),
			messages,
		};
	}

	private getValidationFields($block: HTMLElement, schema: ValidationSchema): FormFieldElement[] {
		const fields = new Set<FormFieldElement>();
		const addFields = (nodeList: NodeListOf<Element>) => {
			Array.from(nodeList).forEach($input => {
				if (
					$input instanceof HTMLInputElement ||
					$input instanceof HTMLTextAreaElement ||
					$input instanceof HTMLSelectElement
				) {
					fields.add($input);
				}
			});
		};

		for (const [key, def] of Object.entries(schema)) {
			if (def.selector) {
				try {
					addFields($block.querySelectorAll(def.selector));
				} catch {
					console.warn(`[FormFather] Invalid validation selector "${def.selector}"`);
				}
				continue;
			}

			this.getAllFields($block)
				.filter($input =>
					this.parseValidationAttribute($input.getAttribute('data-validate')).some(rule => this.getRuleName(rule) === key),
				)
				.forEach($input => fields.add($input));
		}

		addFields($block.querySelectorAll('[required], [data-validate], [data-custom-validate]'));
		return Array.from(fields);
	}

	private async validateInput(
		$input: FormFieldElement,
		rules: ValidationRule[],
		messages: Record<string, string> = {},
		$block: HTMLElement = this.$el,
		validationToken?: number,
	): Promise<boolean> {
		if ($input.hasAttribute('data-no-validate')) return true;

		const isCheckable =
			$input instanceof HTMLInputElement && ($input.type === 'checkbox' || $input.type === 'radio');
		const empty = isCheckable ? !$input.checked : $input.value.trim().length === 0;
		const hasRequiredRule = rules.some(rule => this.getRuleName(rule) === 'required');

		if (empty && !hasRequiredRule) {
			if (!this.isLatestFieldValidation($input, validationToken)) return !this.hasFieldError($input);
			this.clearFieldErrorRecord($input);
			this.hideError($input);
			return true;
		}

		for (const validationRule of rules) {
			const { rule, params } =
				typeof validationRule === 'string'
					? { rule: validationRule, params: undefined }
					: { rule: validationRule.rule, params: validationRule.params };
			const validator = getValidator(rule);
			if (!validator) continue;

			const raw = await validator.fn($input.value, $input, $block, params);
			const isObjectResult = typeof raw === 'object' && raw !== null;
			const passed = isObjectResult ? (raw as any).valid === true : !!raw;

			if (!this.isLatestFieldValidation($input, validationToken)) return !this.hasFieldError($input);

			if (isObjectResult && (raw as any).effect) {
				await (raw as any).effect({
					value: $input.value,
					$input,
					$form: $block,
					params,
				});
			}

			if (!this.isLatestFieldValidation($input, validationToken)) return !this.hasFieldError($input);

			if (!passed) {
				const result = raw as any;
				const message = this.getRuleMessage(
					$input,
					rule,
					messages,
					validator.defaultMessage,
					isObjectResult && typeof result.message === 'string' ? result.message : undefined,
				);

				this.setValidationError($input, rule, message, 'client');
				this.showError($input, message);
				return false;
			}

			if (isObjectResult && (raw as any).stopOthers) {
				return true;
			}
		}

		if (!this.isLatestFieldValidation($input, validationToken)) return !this.hasFieldError($input);
		this.clearFieldErrorRecord($input);
		this.hideError($input);
		return true;
	}

	private async runFieldValidation(
		$input: FormFieldElement,
		rules: ValidationRule[],
		messages: Record<string, string> = {},
		$block: HTMLElement = this.$el,
	): Promise<boolean> {
		const validationToken = this.startFieldValidation($input);

		try {
			const isValid = await this.validateInput($input, rules, messages, $block, validationToken);
			this.finishFieldValidation($input, validationToken, isValid);
			return isValid;
		} catch (error) {
			if (this.isLatestFieldValidation($input, validationToken)) {
				this.clearFieldValidationState($input);
			}
			throw error;
		}
	}

	private getRadioGroup($input: FormFieldElement, $block: HTMLElement): HTMLInputElement[] {
		if (!($input instanceof HTMLInputElement) || $input.type !== 'radio' || !$input.name) return [];

		return Array.from($block.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
			$radio => $radio.name === $input.name,
		);
	}

	/** Показывает ошибку конкретного поля по имени или DOM-элементу. */
	public showFieldError(
		field: FieldReference,
		message: string,
		source: ValidationErrorSource = 'manual',
		rule: string = source,
	): boolean {
		const $field = this.resolveField(field);
		if (!$field) {
			console.warn(`[FormFather] Field "${String(field)}" not found`);
			return false;
		}

		this.setValidationError($field, rule, message, source);
		this.showError($field, message);
		$field.removeAttribute('aria-busy');
		this.setFieldValidationState($field, 'invalid');
		return true;
	}

	/** Проверяет одно поле по имени или DOM-элементу. */
	public async validateField(field: FieldReference): Promise<boolean> {
		const $field = this.resolveField(field);
		if (!$field) {
			console.warn(`[FormFather] Field "${String(field)}" not found`);
			return false;
		}

		const { rules, messages } = this.getFieldValidationConfig($field);
		return this.runFieldValidation($field, rules, messages);
	}

	/**
	 * Проверяет все поля ввода.
	 *
	 * Порядок для каждого поля:
	 *
	 * 1. `required` — если атрибут `required`
	 * 2. правила из `validationSchema`
	 * 3. правила из `data-validate`
	 * 4. правила из `data-custom-validate`
	 *
	 * Для одного поля показывается только первая ошибка. Неизвестные правила фиксируются `console.warn` и исключаются ДО
	 * валидации.
	 */
	async validate($block: HTMLElement = this.$el): Promise<boolean> {
		const schema = this.getValidationSchema();
		const erroredInputs: FormFieldElement[] = [];
		const processed = new WeakSet<FormFieldElement>();
		let ok = true;

		this.errors = [];

		for (const $input of this.getValidationFields($block, schema)) {
			if (processed.has($input)) continue;

			const radioGroup = this.getRadioGroup($input, $block);
			if (radioGroup.length > 0) {
				radioGroup.forEach($radio => processed.add($radio));
			} else {
				processed.add($input);
			}

			const { rules, messages } = this.getFieldValidationConfig($input, schema);
			const fieldValid = await this.runFieldValidation($input, rules, messages, $block);
			if (!fieldValid) {
				ok = false;
				erroredInputs.push($input);
			}
		}

		const formValidation = await this.validateFormValidators();
		if (!formValidation.ok) {
			ok = false;
			erroredInputs.push(...formValidation.erroredInputs);
		}

		const visibleErroredInputs = erroredInputs.filter(item => !item.hasAttribute('data-no-error-scroll'));
		if (!ok && this.config.scrollToFirstErroredInput) {
			this.scrollToFirstErroredInput(visibleErroredInputs);
		}
		if (!ok && this.config.focusFirstErroredInput) {
			this.focusFirstErroredInput(visibleErroredInputs);
		}

		return ok;
	}

	/** Блокирует кнопку отправки данных. */
	private disableSubmit() {
		this.$submits.forEach($submit => {
			$submit.setAttribute('disabled', '');
		});
	}

	/** Снимает блокировку с кнопки отправки данных. */
	private enableSubmit() {
		this.$submits.forEach($submit => {
			$submit.removeAttribute('disabled');
		});
	}

	/** Очищает поля ввода формы. */
	public clearInputs() {
		this.inputs?.forEach($inputEl => {
			const $input = $inputEl as HTMLInputElement;
			if ($input.type === 'radio' || $input.type === 'checkbox') {
				$input.checked = false;
			} else {
				$input.value = '';
				$input.parentElement?.classList.remove('filled');
				$input.dispatchEvent(new Event('input'));
			}
		});
	}

	/** Общие настройки анимаций (можно подправить под вкус) */
	private readonly _anim = {
		duration: 220,
		easing: 'ease',
		paddingTopOpened: 16,
		iconDuration: 700,
	};

	private _prefersReducedMotion(): boolean {
		return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	}

	private _canAnimate(el?: Element | null): boolean {
		return !!(el && 'animate' in el && !this._prefersReducedMotion());
	}

	private _cancelAnimations(el: Element | null | undefined) {
		// Отменяем все активные WAAPI-анимации у элемента
		const animatedEl = el as (Element & { getAnimations?: () => Animation[] }) | null | undefined;
		animatedEl?.getAnimations?.().forEach(animation => animation.cancel());
	}

	/**
	 * Показывает ошибку под полями ввода - ошибку, относящуюся ко всей форме.
	 *
	 * @param {String} text - Текст ошибки.
	 */
	private showErrorForm(text: string) {
		const inputWrappersList = this.$el.querySelectorAll(this.config.inputWrapperSelector!);
		const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1] as HTMLElement | undefined;
		let $errorWrapper = this.$el.querySelector('.error-block-under-input__wrapper') as HTMLElement | null;

		if (!$errorWrapper || ($lastInputWrapper && !($lastInputWrapper.nextElementSibling === $errorWrapper))) {
			$errorWrapper = document.createElement('div');
			$errorWrapper.className = 'error-block-under-input__wrapper';
			$errorWrapper.innerHTML = `
      <div class="error-block-under-input error-block-under-input--warning" style="display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:start;">
        <div class="error-block-under-input__icon-wrapper" style="position:relative;width:20px;height:20px;">
          <span class="error-block-under-input__icon" style="display:block;width:20px;height:20px;"></span>
          <span class="error-block-under-input__icon error-block-under-input__icon--animated" style="display:block;position:absolute;inset:0;"></span>
        </div>
        <p class="error-block-under-input__text" style="margin:0;">
          <span class="error-block-under-input__main-text"></span>
          <span class="error-block-under-input__secondary-text"></span>
        </p>
      </div>
    `;
			// Стартовые inline-стили для анимаций
			Object.assign($errorWrapper.style, {
				boxSizing: 'border-box',
				overflow: 'hidden',
				height: '0px',
				paddingTop: '0px',
				opacity: '0',
			} as CSSStyleDeclaration);
			if ($lastInputWrapper) {
				$lastInputWrapper.insertAdjacentElement('afterend', $errorWrapper);
			} else {
				this.$el.appendChild($errorWrapper);
			}
		} else {
			// убедимся, что нужные стартовые inline-стили есть
			$errorWrapper.style.boxSizing = 'border-box';
			$errorWrapper.style.overflow = 'hidden';
		}

		// Текст
		($errorWrapper.querySelector('.error-block-under-input__main-text') as HTMLElement).textContent = text;
		const $secondaryText = $errorWrapper.querySelector(
			'.error-block-under-input__secondary-text',
		) as HTMLElement | null;
		if ($secondaryText) $secondaryText.textContent = '';

		// Сброс success-класса, если он устанавливался где-то в другом коде
		$errorWrapper.querySelector('.error-block-under-input')?.classList.remove('error-block-under-input--success');

		// Посчитать целевую высоту
		// Чтобы корректно мерить, временно выставим auto
		const prevHeight = $errorWrapper.style.height;
		const prevPadding = $errorWrapper.style.paddingTop;
		$errorWrapper.style.height = 'auto';
		$errorWrapper.style.paddingTop = `${this._anim.paddingTopOpened}px`;
		const targetHeight = $errorWrapper.clientHeight; // фактическая высота открытого состояния

		// Вернуть стартовое состояние (схлопнуто)
		$errorWrapper.style.height = prevHeight || '0px';
		$errorWrapper.style.paddingTop = prevPadding || '0px';

		// Если уже раскрыт на нужную высоту — просто «дзынь» иконке и выходим
		if (
			parseFloat($errorWrapper.style.height) === targetHeight &&
			parseFloat($errorWrapper.style.opacity || '1') === 1
		) {
			this._ringIcon($errorWrapper);
		} else {
			// Анимация раскрытия
			this._cancelAnimations($errorWrapper);
			if (this._canAnimate($errorWrapper)) {
				const anim = $errorWrapper.animate(
					[
						{
							height: `${parseFloat($errorWrapper.style.height) || 0}px`,
							paddingTop: `${parseFloat($errorWrapper.style.paddingTop) || 0}px`,
							opacity: parseFloat($errorWrapper.style.opacity || '0'),
						},
						{
							height: `${targetHeight}px`,
							paddingTop: `${this._anim.paddingTopOpened}px`,
							opacity: 1,
						},
					],
					{ duration: this._anim.duration, easing: this._anim.easing, fill: 'forwards' },
				);
				anim.addEventListener('finish', () => {
					// После анимации: фиксируем авто-высоту, чтобы текст мог меняться
					$errorWrapper.style.height = 'auto';
					$errorWrapper.style.paddingTop = `${this._anim.paddingTopOpened}px`;
					$errorWrapper.style.opacity = '1';
				});
			} else {
				// Фолбэк без анимации
				$errorWrapper.style.height = 'auto';
				$errorWrapper.style.paddingTop = `${this._anim.paddingTopOpened}px`;
				$errorWrapper.style.opacity = '1';
			}
			this._ringIcon($errorWrapper);
		}

		// Скрыть при первом вводе после показа
		this.$el.addEventListener('input', () => this.hideErrorForm(), { passive: true, once: true });
	}

	/** Скрывает ошибку под полями ввода - ошибку, относящуюся ко всей форме. */
	private hideErrorForm() {
		const inputWrappersList = this.$el.querySelectorAll(this.config.inputWrapperSelector!);
		const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1] as HTMLElement | undefined;
		const $errorWrapper = (
			$lastInputWrapper?.nextElementSibling || this.$el.querySelector('.error-block-under-input__wrapper')
		) as HTMLElement | null;
		if (!$errorWrapper || !$errorWrapper.classList.contains('error-block-under-input__wrapper')) return;

		// Текущая высота (если была auto) — измерим и зафиксируем
		const wasAuto = $errorWrapper.style.height === '' || $errorWrapper.style.height === 'auto';
		if (wasAuto) {
			$errorWrapper.style.height = `${$errorWrapper.clientHeight}px`;
		}
		$errorWrapper.style.paddingTop = $errorWrapper.style.paddingTop || `${this._anim.paddingTopOpened}px`;
		$errorWrapper.style.opacity = $errorWrapper.style.opacity || '1';

		// Анимация схлопывания
		this._cancelAnimations($errorWrapper);
		if (this._canAnimate($errorWrapper)) {
			const anim = $errorWrapper.animate(
				[
					{
						height: `${parseFloat($errorWrapper.style.height) || $errorWrapper.clientHeight}px`,
						paddingTop: `${parseFloat($errorWrapper.style.paddingTop) || this._anim.paddingTopOpened}px`,
						opacity: parseFloat($errorWrapper.style.opacity || '1'),
					},
					{ height: '0px', paddingTop: '0px', opacity: 0 },
				],
				{ duration: this._anim.duration, easing: this._anim.easing, fill: 'forwards' },
			);
			anim.addEventListener('finish', () => {
				// После закрытия можно удалить узел или оставить схлопнутым
				$errorWrapper.remove();
				// Если хотите оставлять в DOM:
				// $errorWrapper.style.height = '0px';
				// $errorWrapper.style.paddingTop = '0px';
				// $errorWrapper.style.opacity = '0';
			});
		} else {
			// Фолбэк без анимации
			$errorWrapper.remove();
		}
	}

	/** Короткая анимация иконки без CSS */
	private _ringIcon($wrapper: HTMLElement) {
		const $icon = $wrapper.querySelector('.error-block-under-input__icon--animated') as HTMLElement | null;
		if (!$icon) return;

		this._cancelAnimations($icon);
		if (!this._canAnimate($icon)) return;

		// Небольшое «качание» и вспышка прозрачности
		$icon.animate(
			[
				{ transform: 'rotate(0deg) scale(1)', opacity: 0 },
				{ transform: 'rotate(-8deg) scale(1.05)', opacity: 1, offset: 0.15 },
				{ transform: 'rotate(8deg)  scale(1.05)', opacity: 1, offset: 0.3 },
				{ transform: 'rotate(-6deg) scale(1.03)', opacity: 1, offset: 0.45 },
				{ transform: 'rotate(6deg)  scale(1.03)', opacity: 1, offset: 0.6 },
				{ transform: 'rotate(0deg)  scale(1)', opacity: 0 },
			],
			{ duration: this._anim.iconDuration, easing: 'ease' },
		);
	}

	/** Полностью снимает слушатели и чистит артефакты формы. */
	public destroy(): void {
		// 1) Снять submit-слушатель
		if (this._onSubmitHandler) {
			this.$el.removeEventListener('submit', this._onSubmitHandler as EventListener);
			this._onSubmitHandler = undefined;
		}

		// 1.1) Снять click-слушатель с кнопки submit
		if (this._onSubmitClickHandler) {
			this.$submits.forEach($submit => {
				$submit.removeEventListener('click', this._onSubmitClickHandler as EventListener);
			});
			this._onSubmitClickHandler = undefined;
		}

		this.clearFieldValidationEvents();
		this.mutationObserver?.disconnect();
		this.mutationObserver = undefined;

		// 2) Удалить формовый error-блок под инпутами (если есть)
		const formErrorWrapper = this.$el.querySelector('.error-block-under-input__wrapper') as HTMLElement | null;
		if (formErrorWrapper) {
			this._cancelAnimations(formErrorWrapper);
			formErrorWrapper.remove();
		}

		// 3) Скрыть/удалить лоадер на кнопке submit
		this.$submits.forEach($submit => {
			$submit.classList.remove('button--loading');
			const btnLoader = $submit.querySelector('.button__loader') as HTMLElement | null;
			if (btnLoader) btnLoader.remove();
		});

		// 4) Сбросить ошибки у инпутов (если разметка позволяет)
		const inputs = this.$el.querySelectorAll<FormFieldElement>('input, textarea, select');
		inputs.forEach($i => {
			this.hideError($i);
			this.clearFieldValidationState($i);
		});

		// 5) Убрать возможный флаг скролла
		document.documentElement.removeAttribute('data-now-scrolling');

		// 6) Очистить ссылки на элементы, чтобы помочь GC
		this.inputs = null;
		this.$submits = [];
		this.errors = [];
		this.waitResponse = false;
		FORM_INSTANCES.delete(this.$el);
	}

	/**
	 * Проверяет входные данные на их корректность.
	 *
	 * @returns {boolean} Корректны данные или нет (true/false).
	 */
	private isCorrectArguments(): boolean {
		if (this.$el.tagName !== 'FORM') {
			console.warn(`$el не является тегом form`);
			return false;
		}

		if (this.$submits.length === 0) {
			console.warn(`В форме нет кнопки с типом submit`);
			return false;
		}

		return true;
	}

	private formDataToObject(formData: FormData): Record<string, any> {
		const data: Record<string, any> = {};

		formData.forEach((value, key) => {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				if (!Array.isArray(data[key])) {
					data[key] = [data[key]];
				}
				data[key].push(value);
			} else {
				data[key] = value;
			}
		});

		return data;
	}

	private appendFormDataValue(formData: FormData, key: string, value: any): void {
		if (value === undefined || value === null) return;

		if (Array.isArray(value)) {
			value.forEach((item, index) => {
				this.appendFormDataValue(formData, `${key}[${index}]`, item);
			});
			return;
		}

		if (value instanceof Blob) {
			formData.append(key, value);
			return;
		}

		formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
	}

	private objectToFormData(data: Record<string, any>): FormData {
		const formData = new FormData();

		Object.entries(data).forEach(([key, value]) => {
			this.appendFormDataValue(formData, key, value);
		});

		return formData;
	}

	private stringifyFormDataValue(value: FormDataEntryValue): string {
		return typeof value === 'string' ? value : value.name;
	}

	private formDataToUrlSearchParams(formData: FormData): URLSearchParams {
		const params = new URLSearchParams();

		formData.forEach((value, key) => {
			params.append(key, this.stringifyFormDataValue(value));
		});

		return params;
	}

	private formDataToTextBody(formData: FormData): string {
		return Array.from(formData)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(this.stringifyFormDataValue(value))}`)
			.join('\n');
	}

	private isBodylessMethod(method: string): boolean {
		return method === 'GET' || method === 'HEAD';
	}

	private appendQueryString(action: string, params: URLSearchParams): string {
		const query = params.toString();
		if (!query) return action;

		const separator = action.includes('?') ? '&' : '?';
		return `${action}${separator}${query}`;
	}

	private findFieldByName(name: string): FormFieldElement | null {
		const fields = Array.from(this.$el.querySelectorAll<FormFieldElement>('input, textarea, select'));
		return fields.find($field => $field.name === name) || null;
	}

	private async parseResponseBody(response: Response): Promise<ResponseBody> {
		try {
			const responseBody = await response.json();
			return responseBody && typeof responseBody === 'object'
				? responseBody
				: {
						success: false,
						error: true,
						'error-msg': 'Некорректный ответ сервера',
					};
		} catch {
			return {
				success: false,
				error: true,
				'error-msg': 'Некорректный ответ сервера',
			};
		}
	}

	private handleUnsuccessfulResponse(responseBody: ResponseBody): void {
		if (responseBody.error !== true) return;

		if (responseBody['error-msg']) {
			this.showErrorForm(responseBody['error-msg']);
		}

		if (responseBody.errors) {
			const fieldsList: FormFieldElement[] = [];
			responseBody.errors.forEach(error => {
				const $field = this.findFieldByName(error.name);
				if ($field) {
					fieldsList.push($field);
					this.setValidationError($field, 'server', error['error-msg'], 'server');
					this.showError($field, error['error-msg']);
					$field.removeAttribute('aria-busy');
					this.setFieldValidationState($field, 'invalid');
				} else {
					console.warn(`Не найдено поле с именем: ${error.name}, для вывода ошибки: ${error['error-msg']}`);
				}
			});
			if (this.config.scrollToFirstErroredInput === true) this.scrollToFirstErroredInput(fieldsList);
			if (this.config.focusFirstErroredInput === true) this.focusFirstErroredInput(fieldsList);
		}
	}

	private async sendData(): Promise<Response> {
		const action = this.$el.getAttribute('action') || '';
		const method = this.$el.getAttribute('method')?.toUpperCase() || 'POST';
		const enctype = this.$el.getAttribute('enctype') || 'application/x-www-form-urlencoded';
		let body: BodyInit | null = null;
		let headers: HeadersInit = {};

		// Сбор данных из формы
		const formData = serializeToFormData(this.$el);
		let data: Record<string, any> = this.formDataToObject(formData);

		if (this.config.logging) {
			for (const key of formData.keys()) console.log(formData.get(key));
		}

		// Применение обёртки, если указано в настройках
		const hasDataWrapper = typeof this.config.wrapData === 'function';
		if (typeof this.config.wrapData === 'function') {
			data = this.config.wrapData(data);
		}
		const requestFormData = hasDataWrapper ? this.objectToFormData(data) : formData;

		if (this.isBodylessMethod(method)) {
			return fetch(this.appendQueryString(action, this.formDataToUrlSearchParams(requestFormData)), {
				method,
				headers,
			});
		}

		switch (enctype) {
			case 'application/x-www-form-urlencoded':
				body = this.formDataToUrlSearchParams(requestFormData).toString();
				headers['Content-Type'] = 'application/x-www-form-urlencoded';
				break;

			case 'multipart/form-data':
				body = requestFormData;
				// ВАЖНО: Не указываем Content-Type, т.к. браузер сам добавит с корректной границей!
				break;

			case 'text/plain':
				body = this.formDataToTextBody(requestFormData);
				headers['Content-Type'] = 'text/plain';
				break;

			case 'application/json':
				body = JSON.stringify(data);
				headers['Content-Type'] = 'application/json';
				break;

			default:
				console.warn(`Неизвестный enctype: ${enctype}. Используется application/x-www-form-urlencoded.`);
				body = this.formDataToUrlSearchParams(requestFormData).toString();
				headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}

		return fetch(action, {
			method,
			body,
			headers,
		});
	}

	public async submit(): Promise<SubmitResult | undefined> {
		if (!this.waitResponse) {
			let loadingFinished = false;
			const finishLoading = () => {
				if (loadingFinished) return;

				this.waitResponse = false;
				if (this.config.showLoaderButton === true) this.hideLoader();
				loadingFinished = true;
			};

			try {
				const beforeSubmitResult = await this.config.onBeforeSubmit?.(this);
				if (beforeSubmitResult === false) {
					return {
						success: false,
					};
				}

				if (this.config.showLoaderButton === true) this.showLoader();

				this.config.onSubmit?.(this);
				this.waitResponse = true;

				const response = await this.sendData();
				const responseBody = await this.parseResponseBody(response);
				finishLoading();

				this.config.onResponse?.(responseBody, this);

				if (response.ok && responseBody.success === true) {
					this.config.onResponseSuccess?.(responseBody, this);
				} else {
					this.config.onResponseUnsuccess?.(responseBody, this);
					this.handleUnsuccessfulResponse(responseBody);
				}

				parseCommonResponseProperties(responseBody);
				return {
					success: response.ok && responseBody.success === true,
					response,
					responseBody,
				};
			} catch (error) {
				finishLoading();
				this.config.onSubmitError?.(error, this);
				throw error;
			}
		}

		return undefined;
	}
}
