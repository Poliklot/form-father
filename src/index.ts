import {
	serializeToFormData,
	isEmailValid,
	isUrlValid,
	parseCommonResponseProperties,
	closest,
	isPhoneValid,
} from './helpers';
import { getValidator } from './validators';

export * from './validators';

type ValidationSchema = Record<
	string,
	{
		rules: (string | { rule: string; params?: any })[];
		selector: string;
		messages?: Record<string, string>;
	}
>;

/** Параметры формы. */
interface FormOptions {
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
	onResponse?: (responseBody: any, formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается после ответа сервера 200.
	 *
	 * @param responseBody - Тело ответа.
	 * @param formInstance - Инстанс формы.
	 */
	onResponseSuccess?: (responseBody: any, formInstance: Form) => void;

	/**
	 * Функция обратного вызова. Запускается после ответа сервера не 200.
	 *
	 * @param responseBody - Тело ответа.
	 * @param formInstance - Инстанс формы.
	 */
	onResponseUnsuccess?: (responseBody: any, formInstance: Form) => void;

	/** Нужно ли показывать loader в кнопке. По умолчанию `true`. */
	showLoaderButton?: boolean;

	/** Нужно ли проскроливать до первого по порядку элемента с ошибкой. По умолчанию `true`. */
	scrollToFirstErroredInput?: boolean;

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

	/** Функция для обёртки отправляемых данных. */
	wrapData?: (data: Record<string, any>) => Record<string, any>;

	/** Схема валидации: поле → массив правил + override-сообщения */
	validationSchema?: ValidationSchema;
}

interface ErrorResponse {
	name: string;
	'error-msg': string;
}

interface ResponseBody {
	success?: boolean;
	error?: boolean;
	'error-msg'?: string;
	errors?: ErrorResponse[];
}

/**
 * Реализует форму отправки данных.
 *
 * @class
 */
export default class Form {
	public $el: HTMLFormElement;
	private options: FormOptions;
	private config: FormOptions;
	private $submit: HTMLInputElement | HTMLButtonElement | null = null;
	private waitResponse: boolean = false;
	private inputs: NodeListOf<HTMLInputElement | HTMLTextAreaElement> | null = null;
	private $licensesCheckbox: HTMLInputElement | null = null;

	private static defaultParams: Partial<FormOptions> = {};
	static defaultValidationSchema: ValidationSchema = {
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
	 * Создать форму.
	 *
	 * @param {HTMLElement} $el - Элемент формы (тег form!).
	 * @param {Object} options - Параметры формы.
	 */
	constructor($el: HTMLElement, options: FormOptions) {
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
			logging: false,
			inputSelector: '.input',
			inputWrapperSelector: '.input-primary',
		};

		/* Слияние параметров: глобальные параметры → пользовательские параметры */
		this.config = Object.assign({}, defaultConfig, Form.defaultParams, options);

		if (this.$el) {
			this.$submit = this.$el.querySelector('input[type="submit"], button[type="submit"]');
			if (this.isCorrectArguments()) this.initialization();
		} else {
			console.warn('Empty $el');
		}
	}

	public getOptions(): FormOptions {
		return this.options;
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

	private initialization() {
		this.inputs = this.$el.querySelectorAll(this.config.inputSelector!) as NodeListOf<
			HTMLInputElement | HTMLTextAreaElement
		>;

		/* TODO: Добавить параметр с возможностью отключать/включать кнопку, в зависимости от валидности поля. */
		// this.$licensesCheckbox = this.$el.querySelector('input[data-input-name="user-consent"]') as HTMLInputElement;

		// if (this.$licensesCheckbox) {
		// 	if (this.$licensesCheckbox.checked) this.enableSubmit();
		// 	else this.disableSubmit();

		// 	this.$licensesCheckbox.addEventListener('change', () => {
		// 		if (this.$licensesCheckbox!.checked) this.enableSubmit();
		// 		else this.disableSubmit();
		// 	});
		// }

		const sendData = async (): Promise<Response> => {
			const action = this.$el.getAttribute('action') || '';
			const method = this.$el.getAttribute('method')?.toUpperCase() || 'POST';
			const enctype = this.$el.getAttribute('enctype') || 'application/x-www-form-urlencoded';
			let body: BodyInit | null = null;
			let headers: HeadersInit = {};

			// Сбор данных из формы
			const formData = serializeToFormData(this.$el);
			let data: Record<string, any> = {};
			formData.forEach((value, key) => {
				data[key] = value;
			});

			if (this.config.logging) {
				for (const key of formData.keys()) console.log(formData.get(key));
			}

			// Применение обёртки, если указано в настройках
			if (typeof this.config.wrapData === 'function') {
				data = this.config.wrapData(data);
			}

			switch (enctype) {
				case 'application/x-www-form-urlencoded':
					body = new URLSearchParams(serializeToFormData(this.$el) as any).toString();
					headers['Content-Type'] = 'application/x-www-form-urlencoded';
					break;

				case 'multipart/form-data':
					body = serializeToFormData(this.$el);
					// ВАЖНО: Не указываем Content-Type, т.к. браузер сам добавит с корректной границей!
					break;

				case 'text/plain':
					body = Array.from(serializeToFormData(this.$el))
						.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
						.join('\n');
					headers['Content-Type'] = 'text/plain';
					break;

				case 'application/json':
					body = JSON.stringify(data);
					headers['Content-Type'] = 'application/json';
					break;

				default:
					console.warn(`Неизвестный enctype: ${enctype}. Используется application/x-www-form-urlencoded.`);
					body = new URLSearchParams(serializeToFormData(this.$el) as any).toString();
					headers['Content-Type'] = 'application/x-www-form-urlencoded';
			}

			return fetch(action, {
				method,
				body,
				headers,
			});
		};

		const submit = async () => {
			if (!this.waitResponse) {
				if (this.config.showLoaderButton === true) this.showLoader();

				this.config.onSubmit?.(this);
				this.waitResponse = true;

				const response = await sendData();
				const responseBody: ResponseBody = await response.json();
				this.waitResponse = false;

				if (this.config.showLoaderButton === true) this.hideLoader();
				this.config.onResponse?.(responseBody, this);

				if (response.status === 200) {
					parseCommonResponseProperties(responseBody);
					if (responseBody.success === true) {
						this.config.onResponseSuccess?.(responseBody, this);
					} else {
						this.config.onResponseUnsuccess?.(responseBody, this);
						if (responseBody.error === true) {
							if (responseBody['error-msg']) {
								this.showErrorForm(responseBody['error-msg']);
							}
							if (responseBody.errors) {
								const inputsList: HTMLInputElement[] = [];
								responseBody.errors.forEach(error => {
									const $input = this.$el.querySelector(`input[name="${error.name}"]`) as HTMLInputElement;
									if ($input) {
										inputsList.push($input);
										this.showError($input, error['error-msg']);
									} else {
										console.warn(`Не найдено поле с именем: ${error.name}, для вывода ошибки: ${error['error-msg']}`);
									}
								});
								if (this.config.scrollToFirstErroredInput === true) this.scrollToFirstErroredInput(inputsList);
							}
						}
					}
				}
			}
		};

		this.$el.addEventListener('submit', async e => {
			e.preventDefault();
			this.config.onBeforeValidate?.(this);

			const isValid = await this.validate();

			this.config.onAfterValidate?.(isValid, this);

			if (isValid) submit();
		});
	}

	/**
	 * Показывает ошибку для поля ввода.
	 *
	 * @param {HTMLInputElement} $input - Поле ввода.
	 * @param {String} text - Текст ошибки.
	 */
	private showError($input: HTMLInputElement, text: string) {
		(closest($input, this.config.inputWrapperSelector!) as any).showError(text);
	}

	/** Показывает лоадер */
	private showLoader() {
		// Создаем SVG элемент
		const loaderSvg = `
			<svg height="38" viewBox="0 0 38 38" width="38" xmlns="http://www.w3.org/2000/svg">
				<defs>
				<linearGradient id="form-father-loader" x1="8.042%" x2="65.682%" y1="0%" y2="23.865%">
					<stop offset="0%" stop-color="${this.config.loaderColor}" stop-opacity="0"/>
					<stop offset="63.146%" stop-color="${this.config.loaderColor}" stop-opacity=".631"/>
					<stop offset="100%" stop-color="${this.config.loaderColor}"/>
				</linearGradient>
				</defs>
				<g fill-rule="evenodd" fill="none">
				<g transform="translate(1 1)">
					<path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke-width="5" stroke="url(#form-father-loader)"></path>
					<circle cx="36" cy="18" fill="${this.config.loaderColor}" r="1"></circle>
				</g>
				</g>
			</svg>
		`;

		// Создаем элемент загрузчика и добавляем SVG внутрь
		const $loaderEl = document.createElement('span');
		$loaderEl.innerHTML = loaderSvg;
		$loaderEl.className = 'button__loader';
		this.$submit?.insertAdjacentElement('afterbegin', $loaderEl);
		requestAnimationFrame(() => {
			$loaderEl.setAttribute('data-showed', '');
		});
	}

	/** Скрывает лоадер */
	private hideLoader() {
		this.$submit?.classList.remove('button--loading');
		const $loader = this.$submit?.querySelector('.button__loader') as HTMLElement;
		if ($loader) {
			$loader.classList.remove('active');
			$loader.removeAttribute('data-showed');
			setTimeout(() => {
				$loader.remove();
			}, 250);
		}
	}

	/**
	 * Скрывает ошибку.
	 *
	 * @param {HTMLInputElement} $input - Поле ввода.
	 */
	private hideError($input: HTMLInputElement) {
		const $inputWrapper = $input.parentElement;
		if ($inputWrapper && $inputWrapper.classList.contains('input__wrapper')) {
			const dataTypeError = $inputWrapper.getAttribute('data-type-error') || 'default';

			if (dataTypeError === 'default') {
				// Init error elements
				// const { $inputErrorIcon, $inputErrorBadge } = this.initErrorElements($inputWrapper, dataTypeError);
			}

			$inputWrapper.classList.remove('input__wrapper--error');
		}
	}

	/**
	 * Проскроливает до первого ошибочного поля.
	 *
	 * @param {HTMLElement[]} inputsList - Массив элементов с ошибкой.
	 */
	private scrollToFirstErroredInput(inputsList: HTMLElement[]) {
		if (inputsList.length > 0) {
			const allInputInFormList = Array.from(this.$el.querySelectorAll('input'));
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

	/**
	 * Проверяет все поля ввода.
	 *
	 * Порядок для КАЖДОГО `<input>`:
	 *
	 * 1. `required` — если атрибут `required`
	 * 2. правила из `validationSchema`
	 * 3. правила из `data-custom-validate`
	 *
	 * Для одного поля показывается только первая ошибка. Неизвестные правила фиксируются `console.warn` и исключаются ДО
	 * валидации, поэтому валидационный цикл больше не проверяет их наличие.
	 */
	async validate(): Promise<boolean> {
		/* ---------- финальная схема (defaults + config) ---------- */
		const schema: ValidationSchema = {
			...(Form.defaultValidationSchema || {}),
			...(this.config.validationSchema || {}),
		};

		const warnUnknown = (r: string) => console.warn(`[FormFather] Unknown validation rule "${r}"`);

		const erroredInputs: HTMLInputElement[] = [];
		const processed = new WeakSet<HTMLInputElement>();
		let ok = true;

		/* ---------- helpers ---------- */

		/** Собирает и тут же фильтрует unknown-rules */
		const collectRules = (
			$input: HTMLInputElement,
			fromSchema: (string | { rule: string; params?: any })[] = [],
		): (string | { rule: string; params?: any })[] => {
			const list: (string | { rule: string; params?: any })[] = [];

			if ($input.hasAttribute('required')) list.push('required'); // 1
			list.push(...fromSchema); // 2

			const custom = ($input.getAttribute('data-custom-validate') ?? '')
				.split(',')
				.map(s => s.trim())
				.filter(Boolean);
			list.push(...custom); // 3

			/* —–– предварительная фильтрация unknown ––– */
			const filtered: typeof list = [];
			for (const r of list) {
				const ruleName = typeof r === 'string' ? r : r.rule;
				if (getValidator(ruleName)) filtered.push(r);
				else warnUnknown(ruleName);
			}
			return filtered;
		};

		const validateInput = async (
			$input: HTMLInputElement,
			rules: (string | { rule: string; params?: any })[],
			msgs: Record<string, string> = {},
		) => {
			const empty =
				$input.type === 'checkbox' || $input.type === 'radio' ? !$input.checked : $input.value.trim().length === 0;

			if (empty && !rules.includes('required')) {
				this.hideError($input);
				return;
			}

			for (const r of rules) {
				const { rule, params } = typeof r === 'string' ? { rule: r, params: undefined } : r;
				const vd = getValidator(rule)!; // гарантированно существует

				const passed = await vd.fn($input.value, $input, this.$el, params);
				if (!passed) {
					ok = false;
					const msg = msgs[rule] ?? vd.defaultMessage;
					this.showError($input, msg);
					erroredInputs.push($input);
					return; // первую ошибку отобразили
				}
			}

			this.hideError($input);
		};

		/* ---------- 1. inputs из schema (config + defaults) ---------- */
		for (const [key, def] of Object.entries(schema)) {
			const { selector, rules = [], messages = {} } = def as any;

			const nodeList = selector
				? this.$el.querySelectorAll(selector) // явный CSS-селектор
				: this.$el.querySelectorAll(`[data-validate="${key}"]`); // fallback по name

			for (const $input of Array.from(nodeList) as HTMLInputElement[]) {
				if (processed.has($input)) continue;
				processed.add($input);

				await validateInput($input, collectRules($input, rules), messages);
			}
		}

		/* ---------- 2. inputs только с data-custom ---------- */
		const rest = Array.from(this.$el.querySelectorAll<HTMLInputElement>('[data-custom-validate]')).filter(
			$i => !processed.has($i),
		);

		for (const $input of rest) {
			processed.add($input);
			await validateInput($input, collectRules($input, []));
		}

		/* ---------- scroll ---------- */
		if (!ok && this.config.scrollToFirstErroredInput) {
			this.scrollToFirstErroredInput(erroredInputs);
		}

		return ok;
	}

	/** Блокирует кнопку отправки данных. */
	private disableSubmit() {
		this.$submit?.setAttribute('disabled', '');
	}

	/** Снимает блокировку с кнопки отправки данных. */
	private enableSubmit() {
		this.$submit?.removeAttribute('disabled');
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
		// @ts-ignore
		el?.getAnimations?.().forEach((a: Animation) => a.cancel());
	}

	/**
	 * Показывает ошибку под полями ввода - ошибку, относящуюся ко всей форме.
	 *
	 * @param {String} text - Текст ошибки.
	 */
	private showErrorForm(text: string) {
		const inputWrappersList = this.$el.querySelectorAll(this.config.inputWrapperSelector!);
		const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1] as HTMLElement;
		let $errorWrapper = this.$el.querySelector('.error-block-under-input__wrapper') as HTMLElement | null;

		if (!$errorWrapper || !($lastInputWrapper.nextElementSibling === $errorWrapper)) {
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
			$lastInputWrapper.insertAdjacentElement('afterend', $errorWrapper);
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
		const $block = $errorWrapper.querySelector('.error-block-under-input') as HTMLElement;

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
		const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1] as HTMLElement;
		const $errorWrapper = $lastInputWrapper.nextElementSibling as HTMLElement | null;
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

		if (!this.$submit) {
			console.warn(`В форме нет кнопки с типом submit`);
			return false;
		}

		return true;
	}
}
