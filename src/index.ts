import {
	serializeToFormData,
	isEmailValid,
	isUrlValid,
	parseCommonResponseProperties,
	closest,
	isPhoneValid,
} from './helpers';

/** Параметры формы. */
interface FormOptions {
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

	/**
	 * Пользовательская функция для проверки телефона. По умолчанию стандартный `isPhoneValid` для русских номеров
	 * телефонов.
	 */
	validatePhone?: (input: HTMLInputElement) => boolean;

	/** Функция для обёртки отправляемых данных. */
	wrapData?: (data: Record<string, any>) => Record<string, any>;
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
	private $el: HTMLFormElement;
	private options: FormOptions;
	private config: FormOptions;
	private $submit: HTMLInputElement | HTMLButtonElement | null = null;
	private waitResponse: boolean = false;
	private inputs: NodeListOf<HTMLInputElement | HTMLTextAreaElement> | null = null;
	private $licensesCheckbox: HTMLInputElement | null = null;

	private static defaultParams: Partial<FormOptions> = {};

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
		this.$licensesCheckbox = this.$el.querySelector('input[data-input-name="user-consent"]') as HTMLInputElement;

		if (this.$licensesCheckbox) {
			if (this.$licensesCheckbox.checked) this.enableSubmit();
			else this.disableSubmit();

			this.$licensesCheckbox.addEventListener('change', () => {
				if (this.$licensesCheckbox!.checked) this.enableSubmit();
				else this.disableSubmit();
			});
		}

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

		this.$el.addEventListener('submit', e => {
			e.preventDefault();
			if (this.checkInputs() && (!this.$licensesCheckbox || (this.$licensesCheckbox && this.$licensesCheckbox.checked)))
				submit();
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
	 * Проверяет все поля ввода на корректность их заполнения.
	 *
	 * Проверяются все поля ввода и если поле некорректно заполнено показывают ошибки рядом с полем ввода.
	 *
	 * @returns {boolean} Корректно заполнены или нет (true/false).
	 */
	private checkInputs(): boolean {
		let isCorrect = true;
		const radioGroups: { [key: string]: { [key: number]: HTMLInputElement } } = {};
		const inputsList: HTMLInputElement[] = [];
		this.inputs?.forEach($inputEl => {
			const $input = $inputEl as HTMLInputElement;
			const inputType = $input.getAttribute('data-check-type') || $input.getAttribute('type') || '';

			if ($input.tagName === 'SELECT') {
				const selectedOption = ($input as unknown as HTMLSelectElement).selectedOptions[0];
				if (selectedOption && selectedOption.value === '' && $input.hasAttribute('required')) {
					this.showError($input, 'Пустое значение');
					inputsList.push($input);
					isCorrect = false;
				}
			} else if (inputType === 'checkbox') {
				if ($input.hasAttribute('required') && !$input.checked) {
					this.showError($input, 'Необходимо согласие');
					inputsList.push($input);
					isCorrect = false;
				}
			} else if (
				this.config.customTypeError?.name !== inputType ||
				($input.tagName === 'TEXTAREA' && !this.config.customTypeError)
			) {
				if ($input.value.length > 0) {
					if (inputType === 'email') {
						if (!isEmailValid($input.value)) {
							this.showError($input, 'Неверный формат');
							inputsList.push($input);
							isCorrect = false;
						}
					}
					if (inputType === 'tel') {
						const isPhoneValidChecker =
							this.config.validatePhone ||
							(($input: HTMLInputElement) => {
								return isPhoneValid($input.value);
							});
						if (!isPhoneValidChecker($input)) {
							this.showError($input, 'Неверный формат');
							inputsList.push($input);
							isCorrect = false;
						}
					}
					if (inputType === 'url') {
						if (!isUrlValid($input.value)) {
							this.showError($input, 'Неверный формат');
							inputsList.push($input);
							isCorrect = false;
						}
					}
					if (inputType === 'text') {
						if ($input.getAttribute('data-check-type') === 'not-numbers') {
							if (/[0-9]/.test($input.value)) {
								this.showError($input, 'Неверный формат');
								inputsList.push($input);
								isCorrect = false;
							}
						}
					}
					if (inputType === 'radio') {
						const name = $input.getAttribute('name') || '';
						if (!radioGroups[name]) {
							radioGroups[name] = {};
						}
						radioGroups[name][Object.keys(radioGroups[name]).length] = $input;
					}
				} else if ($input.hasAttribute('required')) {
					this.showError($input, 'Пустое значение');
					inputsList.push($input);
					isCorrect = false;
				}
			}
		});

		if (Object.keys(radioGroups).length > 0) {
			for (const key in radioGroups) {
				const group = radioGroups[key];
				let isRequired = false;
				let $checkedInput: HTMLInputElement | null = null;

				for (const keyGroup in group) {
					const $radio = group[keyGroup];
					if ($radio.hasAttribute('required')) isRequired = true;
					if ($radio.checked) {
						if ($checkedInput === null) {
							$checkedInput = $radio;
						} else {
							return false;
						}
					}
				}

				if ($checkedInput === null && isRequired) {
					this.showErrorForm('Необходимо указать оценку');
					return false;
				}
			}
		}

		if (this.config.scrollToFirstErroredInput === true) this.scrollToFirstErroredInput(inputsList);

		return isCorrect;
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
			if ($input.type === 'radio') {
				$input.checked = false;
			} else {
				$input.value = '';
				$input.parentElement?.classList.remove('filled');
				$input.dispatchEvent(new Event('input'));
			}
		});
	}

	/**
	 * Показывает ошибку под полями ввода - ошибку, относящуюся ко всей форме.
	 *
	 * @param {String} text - Текст ошибки.
	 */
	private showErrorForm(text: string) {
		const inputWrappersList = this.$el.querySelectorAll('.input__wrapper');
		const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1] as HTMLElement;
		let $errorWrapper = this.$el.querySelector('.error-block-under-input__wrapper') as HTMLElement;

		if (!$errorWrapper || !($lastInputWrapper.nextElementSibling === $errorWrapper)) {
			$errorWrapper = document.createElement('div');
			$errorWrapper.className = 'error-block-under-input__wrapper';
			$errorWrapper.innerHTML = `
        <div class="error-block-under-input error-block-under-input--warning">
          <div class="error-block-under-input__icon-wrapper">
            <span class="error-block-under-input__icon">
              <!-- SVG content -->
            </span>
            <span class="error-block-under-input__icon error-block-under-input__icon--animated" style="display:none;"></span>
          </div>
          <p class="error-block-under-input__text">
            <span class="error-block-under-input__main-text">${text}</span>
            <span class="error-block-under-input__secondary-text"></span>
          </p>
        </div>`;
			$lastInputWrapper.insertAdjacentElement('afterend', $errorWrapper);
		} else {
			$errorWrapper.classList.add('error-block-under-input--warning');
			$errorWrapper.querySelector('.error-block-under-input__icon')!.innerHTML = '<!-- SVG content -->';
			$errorWrapper.querySelector('.error-block-under-input__main-text')!.textContent = text;
		}

		this.$el.addEventListener(
			'input',
			() => {
				this.hideErrorForm();
			},
			{ passive: true, once: true },
		);

		$errorWrapper.querySelector('.error-block-under-input')?.classList.remove('error-block-under-input--success');
		const $secondaryText = $errorWrapper.querySelector('.error-block-under-input__secondary-text');
		if ($secondaryText) $secondaryText.textContent = '';

		const currentHeight = parseFloat($errorWrapper.style.height) || 0;
		const currentPaddingTop = parseFloat(window.getComputedStyle($errorWrapper).paddingTop) || 0;
		const errorBlockHeight = ($errorWrapper.querySelector('.error-block-under-input') as HTMLElement).scrollHeight + 16;

		if (currentHeight !== errorBlockHeight) {
			$errorWrapper.style.height = `${currentHeight}px`;
			$errorWrapper.style.opacity = '0';
			$errorWrapper.style.paddingTop = `${currentPaddingTop}px`;
		}
	}

	/** Скрывает ошибку под полями ввода - ошибку, относящуюся ко всей форме. */
	private hideErrorForm() {
		const inputWrappersList = this.$el.querySelectorAll('.input__wrapper');
		const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1];
		const nextElement = $lastInputWrapper.nextElementSibling as HTMLElement;
		if (nextElement && nextElement.classList.contains('error-block-under-input__wrapper')) {
			// Анимация скрытия ошибки
		}
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
