/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * Возвращает форматированную дату.
 *
 * @param {string} dateValue
 * @param {string} format
 *
 * @returns {string}
 */
function formatDate(dateValue, format) {
    const date = new Date(dateValue);
    /**
     * Добавляет ведущие нули.
     *
     * @param {number} num
     *
     * @returns {string}
     */
    const pad = (num) => num.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear().toString();
    return format.replace('dd', day).replace('mm', month).replace('yyyy', year);
}
/**
 * Находит родительский элемент по заданому селектору.
 *
 * @param {HTMLElement | null} $el - Элемент, чего родителя нужно найти.
 * @param {string} selector - Селектор родителя.
 *
 * @returns {HTMLElement | null} Элемент родителя. Но если родителя с таким селектори не было найдено возвращается null.
 */
function closest($el, selector) {
    if ($el == null)
        return null;
    let parent = $el;
    while (parent) {
        if (parent.matches(selector)) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}
/** Включает блокировку скролла страницы */
function blockScrollBody() {
    window.lastBlockScrollPosition = window.pageYOffset;
    document.body.style.top = `${-window.lastBlockScrollPosition}px`;
    document.body.classList.add('body--block-scroll');
}
/** Отменяет блокировку скролла страницы */
function unblockScrollBody() {
    document.body.classList.remove('body--block-scroll');
    document.body.style.top = '';
    window.scrollTo(0, window.lastBlockScrollPosition || 0);
}
/**
 * Проверяет является ли строка валидным адресом электронной почты.
 *
 * @param {string} value - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным адресом электронной почты true/false.
 */
function isEmailValid(value) {
    return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu.test(value);
}
const HTTP_PROTOCOLS = ['http:', 'https:'];
function getNormalizedUrlString(originalUrlString) {
    const trimmedUrl = originalUrlString.trim();
    if (trimmedUrl.length === 0)
        return '';
    if (trimmedUrl.startsWith('//')) {
        return `https:${trimmedUrl}`;
    }
    return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
}
function isValidIpv4(hostname) {
    const parts = hostname.split('.');
    if (parts.length !== 4)
        return false;
    return parts.every(part => {
        if (!/^\d{1,3}$/.test(part))
            return false;
        const num = Number(part);
        return num >= 0 && num <= 255;
    });
}
function isValidIpv6(hostname) {
    if (!hostname.startsWith('[') || !hostname.endsWith(']'))
        return false;
    const normalizedHostname = hostname.slice(1, -1);
    return normalizedHostname.includes(':') && /^[\da-f:.]+$/i.test(normalizedHostname);
}
function isValidDomainLabel(label) {
    return label.length > 0 && label.length <= 63 && /^[a-z\d-]+$/i.test(label) && !label.startsWith('-') && !label.endsWith('-');
}
function isValidDomainHostname(hostname) {
    const labels = hostname.split('.');
    return labels.length >= 2 && labels.every(isValidDomainLabel);
}
function isAllowedHostname(hostname) {
    if (!hostname)
        return false;
    return (hostname === 'localhost' || isValidIpv4(hostname) || isValidIpv6(hostname) || isValidDomainHostname(hostname));
}
/**
 * Проверяет является ли строка валидным url.
 *
 * @param {string} originalUrlString - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным url адресом true/false.
 */
function isUrlValid(originalUrlString) {
    const urlString = getNormalizedUrlString(originalUrlString);
    if (urlString.length === 0)
        return false;
    try {
        const url = new URL(urlString);
        return HTTP_PROTOCOLS.includes(url.protocol) && isAllowedHostname(url.hostname);
    }
    catch (_a) {
        return false;
    }
}
/**
 * Проверяет является ли строка валидным номером телефона.
 *
 * @param {string} value - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным номером телефона true/false.
 */
function isPhoneValid(value) {
    const numbersArray = [];
    Array.from(value).forEach(char => {
        if (!!Number(char) || Number(char) === 0)
            numbersArray.push(char);
    });
    if (numbersArray.length < 11 || (numbersArray.length < 12 && value[1] === '+'))
        return false;
    return true;
}
/**
 * Кастомная сериализация формы в объект FormData.
 *
 * @param {HTMLElement} $element - DOM элемент для сериализации.
 *
 * @returns {FormData} Сериализованные данные формы в объекте FormData.
 */
function serializeToFormData($element) {
    const elements = $element.tagName === 'FORM'
        ? Array.from($element.elements)
        : Array.from($element.querySelectorAll('input, select, textarea, button'));
    const data = new FormData();
    elements.forEach(element => {
        if (!(element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLButtonElement)) {
            return;
        }
        if (!element.name || element.disabled || element.hasAttribute('data-no-serialize')) {
            return;
        }
        if (element instanceof HTMLButtonElement) {
            return;
        }
        const { name, type } = element;
        if (type === 'file') {
            if (element.multiple) {
                const files = element.files;
                if (files) {
                    for (let i = 0; i < files.length; i++) {
                        // Добавляем каждый файл с уникальным ключом
                        data.append(`${name}[${i}]`, files[i]);
                    }
                }
            }
            else {
                const files = element.files;
                if (files && files[0])
                    data.append(name, files[0]);
            }
        }
        else {
            let value;
            if (type === 'select-one' || type === 'select-multiple') {
                // Обработка select элементов
                const select = element;
                if (type === 'select-multiple') {
                    const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
                    selectedOptions.forEach((val, index) => {
                        data.append(`${name}[${index}]`, val);
                    });
                }
                else {
                    value = select.value;
                    if (value)
                        data.append(name, value);
                }
            }
            else if (type === 'tel') {
                value = element.value
                    .split(/[\s()-]/)
                    .join('')
                    .replace(/^8/, '+7');
            }
            else if (type === 'checkbox' || type === 'radio') {
                if (!element.checked)
                    return;
                value = element.value;
            }
            else if (type === 'date') {
                const format = element.getAttribute('data-date-format');
                value = format ? formatDate(element.value, format) : element.value;
            }
            else {
                value = element.value;
            }
            if (value && type !== 'select-one' && type !== 'select-multiple') {
                data.append(name, value);
            }
        }
    });
    return data;
}
/**
 * Функция для разбора общих свойств ответа.
 *
 * @param {any} responseBody - Тело ответа.
 */
function parseCommonResponseProperties(responseBody) {
    if (Object.prototype.hasOwnProperty.call(responseBody, 'redirect-url')) {
        if (responseBody['redirect-url-delay']) {
            const redirectUrlDelay = Number(responseBody['redirect-url-delay']);
            setTimeout(() => {
                window.location.href = responseBody['redirect-url'];
            }, redirectUrlDelay);
        }
        else {
            window.location.href = responseBody['redirect-url'];
        }
    }
    else if (Object.prototype.hasOwnProperty.call(responseBody, 'reload')) {
        if (responseBody.reload === true) {
            if (responseBody['reload-delay']) {
                const reloadDelay = Number(responseBody['reload-delay']);
                setTimeout(() => {
                    window.location.reload();
                }, reloadDelay);
            }
            else {
                window.location.reload();
            }
        }
    }
    // Не показываем тост если делается редирект или обновление страницы (чтобы небыло вспышек) - в этом случае тосты обрабытываются в ответе onResponseSuccess | onResponseUnsuccess
    else {
        if (Object.prototype.hasOwnProperty.call(responseBody, 'toast')) {
            const toasts = responseBody['toast'];
            const normalizedToasts = Array.isArray(toasts) ? toasts : [toasts];
            normalizedToasts.forEach(toast => {
                window.showToast(toast);
            });
        }
        else if (Object.prototype.hasOwnProperty.call(responseBody, 'error-toast')) {
            /** @deprecated */
            window.showToast(responseBody['error-toast']);
        }
    }
}
/**
 * Сериализует данные формы в объект JSON.
 *
 * @param {HTMLFormElement} form - Элемент формы.
 *
 * @returns {Object} Сериализованные данные формы.
 */
function serializeFormToJSON(form) {
    const obj = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
        if (obj.hasOwnProperty(key)) {
            if (!Array.isArray(obj[key])) {
                obj[key] = [obj[key]];
            }
            obj[key].push(value);
        }
        else {
            obj[key] = value;
        }
    });
    return obj;
}

var _a$1;
/* ---------- singleton-storage на globalThis ---------- */
const GLOBAL_KEY = Symbol.for('FormFather.validators');
const validators = (_a$1 = globalThis[GLOBAL_KEY]) !== null && _a$1 !== void 0 ? _a$1 : (globalThis[GLOBAL_KEY] = new Map());
/* ---------- API ---------- */
function registerValidator(name, fn, defaultMessage, { override = false } = {}) {
    if (validators.has(name) && !override) {
        console.warn(`[FormFather] Validator "${name}" already exists; pass { override: true } to replace`);
        return;
    }
    validators.set(name, { fn, defaultMessage });
}
const getValidator = (name) => validators.get(name);
function getAllValidators() {
    return new Map(validators); // копию, чтобы никто не мутировал оригинал
}
/* ---------- built-in rules ---------- */
function registerBuiltinValidator(name, fn, defaultMessage) {
    if (!validators.has(name)) {
        validators.set(name, { fn, defaultMessage });
    }
}
registerBuiltinValidator('required', (value, $input, $form) => {
    if ($input && $input.type) {
        if ($input.type === 'checkbox') {
            return $input.checked;
        }
        if ($input.type === 'radio') {
            const group = $form.querySelectorAll(`input[type="radio"][name="${$input.name}"]`);
            return Array.from(group).some(el => el.checked);
        }
    }
    // fallback — если нет $input (например, в unit-тестах)
    return value.trim().length > 0;
}, 'Пустое значение');
registerBuiltinValidator('email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Неверный формат');
registerBuiltinValidator('tel', v => /^\+7\d{10}$/.test(v), 'Неверный формат');
registerBuiltinValidator('url', v => isUrlValid(v), 'Неверный формат');
registerBuiltinValidator('not-numbers', v => !/[0-9]/.test(v), 'Неверный формат');

var _a;
// --- shared cross-file state (singleton via globalThis) ---
const FORM_GLOBAL_KEY = Symbol.for('formfather.shared');
const __shared = 
// уже существует? используем его
(_a = globalThis[FORM_GLOBAL_KEY]) !== null && _a !== void 0 ? _a : 
// иначе создаём
(globalThis[FORM_GLOBAL_KEY] = {
    defaultParams: {},
    defaultValidationSchema: undefined,
});
let loaderIdCounter = 0;
/** Изначальная дефолтная схема. */
const INITIAL_DEFAULT_SCHEMA = {
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
class Form {
    static get defaultParams() {
        return __shared.defaultParams;
    }
    static set defaultParams(v) {
        __shared.defaultParams = v;
    }
    static get defaultValidationSchema() {
        var _a;
        return ((_a = __shared.defaultValidationSchema) !== null && _a !== void 0 ? _a : (__shared.defaultValidationSchema = INITIAL_DEFAULT_SCHEMA));
    }
    static set defaultValidationSchema(v) {
        __shared.defaultValidationSchema = v;
    }
    /**
     * Создать форму.
     *
     * @param {HTMLElement} $el - Элемент формы (тег form!).
     * @param {Object} options - Параметры формы.
     */
    constructor($el, options = {}) {
        this.$submits = [];
        this.waitResponse = false;
        this.inputs = null;
        /** Общие настройки анимаций (можно подправить под вкус) */
        this._anim = {
            duration: 220,
            easing: 'ease',
            paddingTopOpened: 16,
            iconDuration: 700,
        };
        this.$el = $el;
        this.options = options;
        const defaultConfig = {
            onSubmit: () => { },
            onResponse: () => { },
            onResponseSuccess: () => { },
            onResponseUnsuccess: () => { },
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
            this.$submits = this.findSubmitElements();
            this._onSubmitClickHandler = (e) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                e.preventDefault();
                (_b = (_a = this.config).onBeforeValidate) === null || _b === void 0 ? void 0 : _b.call(_a, this);
                const isValid = yield this.validate();
                (_d = (_c = this.config).onAfterValidate) === null || _d === void 0 ? void 0 : _d.call(_c, isValid, this);
                if (isValid) {
                    yield this.submit();
                }
            });
            if (this.isCorrectArguments()) {
                this.$submits.forEach($submit => {
                    $submit.addEventListener('click', this._onSubmitClickHandler);
                });
                this.initialization();
            }
        }
        else {
            console.warn('Empty $el');
        }
    }
    getOptions() {
        return this.options;
    }
    /**
     * Обновляет параметры по умолчанию для настроек формы. Метод объединяет переданные параметры с уже существующими
     * параметрами по умолчанию.
     *
     * @param {Partial<FormOptions>} params - Объект, содержащий новые значения параметров. Можно передать только те
     *   свойства, которые необходимо обновить; остальные сохранятся без изменений.
     */
    static setDefaultParams(params) {
        this.defaultParams = Object.assign(Object.assign({}, this.defaultParams), params);
    }
    findSubmitElements() {
        return Array.from(this.$el.querySelectorAll('input[type="submit"], input[type="image"], button[type="submit"], button:not([type])'));
    }
    initialization() {
        this.inputs = this.$el.querySelectorAll(this.config.inputSelector);
        this._onSubmitHandler = (e) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            e.preventDefault();
            (_b = (_a = this.config).onBeforeValidate) === null || _b === void 0 ? void 0 : _b.call(_a, this);
            const isValid = yield this.validate();
            (_d = (_c = this.config).onAfterValidate) === null || _d === void 0 ? void 0 : _d.call(_c, isValid, this);
            if (isValid)
                this.submit();
        });
        this.$el.addEventListener('submit', this._onSubmitHandler);
    }
    /**
     * Показывает ошибку для поля ввода.
     *
     * @param {HTMLInputElement} $input - Поле ввода.
     * @param {String} text - Текст ошибки.
     */
    showError($input, text) {
        const $inputWrapper = closest($input, this.config.inputWrapperSelector);
        if (!$inputWrapper) {
            console.warn(`Не найдена обёртка для поля с именем: ${$input.name || $input.type}`);
            return;
        }
        const customShowError = $inputWrapper.showError;
        if (typeof customShowError === 'function') {
            customShowError.call($inputWrapper, text);
            return;
        }
        $input.setAttribute('aria-invalid', 'true');
        $inputWrapper.classList.add('input__wrapper--error');
        let $error = $inputWrapper.querySelector('[data-form-father-error]');
        if (!$error) {
            $error = document.createElement('div');
            $error.setAttribute('data-form-father-error', '');
            $error.setAttribute('role', 'alert');
            $input.insertAdjacentElement('afterend', $error);
        }
        $error.textContent = text;
    }
    /** Показывает лоадер */
    showLoader() {
        this.$submits.forEach($submit => {
            $submit.classList.add('button--loading');
            if ($submit.querySelector('.button__loader'))
                return;
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
    hideLoader() {
        this.$submits.forEach($submit => {
            $submit.classList.remove('button--loading');
            const $loader = $submit.querySelector('.button__loader');
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
    hideError($input) {
        var _a;
        const $inputWrapper = closest($input, this.config.inputWrapperSelector) || $input.parentElement;
        $input.removeAttribute('aria-invalid');
        (_a = $inputWrapper === null || $inputWrapper === void 0 ? void 0 : $inputWrapper.querySelector('[data-form-father-error]')) === null || _a === void 0 ? void 0 : _a.remove();
        $inputWrapper === null || $inputWrapper === void 0 ? void 0 : $inputWrapper.classList.remove('input__wrapper--error');
        if ($inputWrapper && $inputWrapper.classList.contains('input__wrapper')) {
            $inputWrapper.getAttribute('data-type-error') || 'default';
        }
    }
    /**
     * Проскроливает до первого ошибочного поля.
     *
     * @param {HTMLElement[]} inputsList - Массив элементов с ошибкой.
     */
    scrollToFirstErroredInput(inputsList) {
        if (inputsList.length > 0) {
            const allInputInFormList = Array.from(this.$el.querySelectorAll('input'));
            let $firstInputOnForm = null;
            let minIndex = Infinity;
            inputsList.forEach($input => {
                const findIndex = allInputInFormList.findIndex($item => $item === $input);
                if (findIndex < minIndex) {
                    minIndex = findIndex;
                    $firstInputOnForm = $input;
                }
            });
            if ($firstInputOnForm) {
                const rect = $firstInputOnForm.getBoundingClientRect();
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
    validate() {
        return __awaiter(this, arguments, void 0, function* ($block = this.$el) {
            /* ---------- финальная схема (defaults + config) ---------- */
            const schema = Object.assign(Object.assign({}, (Form.defaultValidationSchema || {})), (this.config.validationSchema || {}));
            const warnUnknown = (r) => console.warn(`[FormFather] Unknown validation rule "${r}"`);
            const erroredInputs = [];
            const processed = new WeakSet();
            let ok = true;
            /* ---------- helpers ---------- */
            /** Собирает и тут же фильтрует unknown-rules */
            const collectRules = ($input, fromSchema = []) => {
                var _a;
                const list = [];
                if ($input.hasAttribute('required'))
                    list.push('required'); // 1
                list.push(...fromSchema); // 2
                const custom = ((_a = $input.getAttribute('data-custom-validate')) !== null && _a !== void 0 ? _a : '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
                list.push(...custom.map(ruleString => {
                    const [rule, ...params] = ruleString.split(':').map(s => s.trim());
                    return params.length > 0 ? { rule, params: params.length === 1 ? params[0] : params } : rule;
                })); // 3
                /* —–– предварительная фильтрация unknown ––– */
                const filtered = [];
                for (const r of list) {
                    const ruleName = typeof r === 'string' ? r : r.rule;
                    if (getValidator(ruleName))
                        filtered.push(r);
                    else
                        warnUnknown(ruleName);
                }
                return filtered;
            };
            const validateInput = ($input_1, rules_1, ...args_1) => __awaiter(this, [$input_1, rules_1, ...args_1], void 0, function* ($input, rules, msgs = {}) {
                if ($input.hasAttribute('data-no-validate'))
                    return;
                const empty = $input.type === 'checkbox' || $input.type === 'radio' ? !$input.checked : $input.value.trim().length === 0;
                const hasRequiredRule = rules.some(r => (typeof r === 'string' ? r === 'required' : r.rule === 'required'));
                if (empty && !hasRequiredRule) {
                    this.hideError($input);
                    return;
                }
                for (const r of rules) {
                    const { rule, params } = typeof r === 'string' ? { rule: r, params: undefined } : r;
                    const vd = getValidator(rule); // гарантированно существует
                    const raw = yield vd.fn($input.value, $input, $block, params);
                    const isObj = typeof raw === 'object' && raw !== null;
                    const passed = isObj ? raw.valid === true : !!raw;
                    // сайд-эффект (если есть)
                    if (isObj && raw.effect) {
                        yield raw.effect({
                            value: $input.value,
                            $input,
                            $form: $block,
                            params,
                        });
                    }
                    if (!passed) {
                        ok = false;
                        const r = raw;
                        const msg = (isObj && typeof r.message === 'string' && r.message) || msgs[rule] || vd.defaultMessage;
                        this.showError($input, msg);
                        erroredInputs.push($input);
                        return; // первую ошибку отобразили
                    }
                    // хотим прервать цепочку правил, даже если успех
                    if (isObj && raw.stopOthers) {
                        return;
                    }
                }
                this.hideError($input);
            });
            const getRadioGroup = ($input) => {
                if ($input.type !== 'radio' || !$input.name)
                    return [];
                return Array.from($block.querySelectorAll('input[type="radio"]')).filter($radio => $radio.name === $input.name);
            };
            /* ---------- 1. inputs из schema (config + defaults) ---------- */
            for (const [key, def] of Object.entries(schema)) {
                const { selector, rules = [], messages = {} } = def;
                const nodeList = selector
                    ? $block.querySelectorAll(selector) // явный CSS-селектор
                    : $block.querySelectorAll(`[data-validate="${key}"]`); // fallback по name
                for (const $input of Array.from(nodeList)) {
                    if (processed.has($input))
                        continue;
                    const radioGroup = getRadioGroup($input);
                    if (radioGroup.length > 0) {
                        radioGroup.forEach($radio => processed.add($radio));
                        yield validateInput($input, collectRules($input, rules), messages);
                        continue;
                    }
                    processed.add($input);
                    yield validateInput($input, collectRules($input, rules), messages);
                }
            }
            /* ---------- 2. inputs только с data-custom ---------- */
            const rest = Array.from($block.querySelectorAll('[data-custom-validate]')).filter($i => !processed.has($i));
            for (const $input of rest) {
                processed.add($input);
                yield validateInput($input, collectRules($input, []));
            }
            /* ---------- scroll ---------- */
            if (!ok && this.config.scrollToFirstErroredInput) {
                this.scrollToFirstErroredInput(erroredInputs.filter(item => !item.hasAttribute('data-no-error-scroll')));
            }
            return ok;
        });
    }
    /** Блокирует кнопку отправки данных. */
    disableSubmit() {
        this.$submits.forEach($submit => {
            $submit.setAttribute('disabled', '');
        });
    }
    /** Снимает блокировку с кнопки отправки данных. */
    enableSubmit() {
        this.$submits.forEach($submit => {
            $submit.removeAttribute('disabled');
        });
    }
    /** Очищает поля ввода формы. */
    clearInputs() {
        var _a;
        (_a = this.inputs) === null || _a === void 0 ? void 0 : _a.forEach($inputEl => {
            var _a;
            const $input = $inputEl;
            if ($input.type === 'radio' || $input.type === 'checkbox') {
                $input.checked = false;
            }
            else {
                $input.value = '';
                (_a = $input.parentElement) === null || _a === void 0 ? void 0 : _a.classList.remove('filled');
                $input.dispatchEvent(new Event('input'));
            }
        });
    }
    _prefersReducedMotion() {
        var _a;
        return typeof window !== 'undefined' && ((_a = window.matchMedia) === null || _a === void 0 ? void 0 : _a.call(window, '(prefers-reduced-motion: reduce)').matches);
    }
    _canAnimate(el) {
        return !!(el && 'animate' in el && !this._prefersReducedMotion());
    }
    _cancelAnimations(el) {
        var _a;
        // Отменяем все активные WAAPI-анимации у элемента
        const animatedEl = el;
        (_a = animatedEl === null || animatedEl === void 0 ? void 0 : animatedEl.getAnimations) === null || _a === void 0 ? void 0 : _a.call(animatedEl).forEach(animation => animation.cancel());
    }
    /**
     * Показывает ошибку под полями ввода - ошибку, относящуюся ко всей форме.
     *
     * @param {String} text - Текст ошибки.
     */
    showErrorForm(text) {
        var _a;
        const inputWrappersList = this.$el.querySelectorAll(this.config.inputWrapperSelector);
        const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1];
        let $errorWrapper = this.$el.querySelector('.error-block-under-input__wrapper');
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
            });
            if ($lastInputWrapper) {
                $lastInputWrapper.insertAdjacentElement('afterend', $errorWrapper);
            }
            else {
                this.$el.appendChild($errorWrapper);
            }
        }
        else {
            // убедимся, что нужные стартовые inline-стили есть
            $errorWrapper.style.boxSizing = 'border-box';
            $errorWrapper.style.overflow = 'hidden';
        }
        // Текст
        $errorWrapper.querySelector('.error-block-under-input__main-text').textContent = text;
        const $secondaryText = $errorWrapper.querySelector('.error-block-under-input__secondary-text');
        if ($secondaryText)
            $secondaryText.textContent = '';
        // Сброс success-класса, если он устанавливался где-то в другом коде
        (_a = $errorWrapper.querySelector('.error-block-under-input')) === null || _a === void 0 ? void 0 : _a.classList.remove('error-block-under-input--success');
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
        if (parseFloat($errorWrapper.style.height) === targetHeight &&
            parseFloat($errorWrapper.style.opacity || '1') === 1) {
            this._ringIcon($errorWrapper);
        }
        else {
            // Анимация раскрытия
            this._cancelAnimations($errorWrapper);
            if (this._canAnimate($errorWrapper)) {
                const anim = $errorWrapper.animate([
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
                ], { duration: this._anim.duration, easing: this._anim.easing, fill: 'forwards' });
                anim.addEventListener('finish', () => {
                    // После анимации: фиксируем авто-высоту, чтобы текст мог меняться
                    $errorWrapper.style.height = 'auto';
                    $errorWrapper.style.paddingTop = `${this._anim.paddingTopOpened}px`;
                    $errorWrapper.style.opacity = '1';
                });
            }
            else {
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
    hideErrorForm() {
        const inputWrappersList = this.$el.querySelectorAll(this.config.inputWrapperSelector);
        const $lastInputWrapper = inputWrappersList[inputWrappersList.length - 1];
        const $errorWrapper = (($lastInputWrapper === null || $lastInputWrapper === void 0 ? void 0 : $lastInputWrapper.nextElementSibling) || this.$el.querySelector('.error-block-under-input__wrapper'));
        if (!$errorWrapper || !$errorWrapper.classList.contains('error-block-under-input__wrapper'))
            return;
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
            const anim = $errorWrapper.animate([
                {
                    height: `${parseFloat($errorWrapper.style.height) || $errorWrapper.clientHeight}px`,
                    paddingTop: `${parseFloat($errorWrapper.style.paddingTop) || this._anim.paddingTopOpened}px`,
                    opacity: parseFloat($errorWrapper.style.opacity || '1'),
                },
                { height: '0px', paddingTop: '0px', opacity: 0 },
            ], { duration: this._anim.duration, easing: this._anim.easing, fill: 'forwards' });
            anim.addEventListener('finish', () => {
                // После закрытия можно удалить узел или оставить схлопнутым
                $errorWrapper.remove();
                // Если хотите оставлять в DOM:
                // $errorWrapper.style.height = '0px';
                // $errorWrapper.style.paddingTop = '0px';
                // $errorWrapper.style.opacity = '0';
            });
        }
        else {
            // Фолбэк без анимации
            $errorWrapper.remove();
        }
    }
    /** Короткая анимация иконки без CSS */
    _ringIcon($wrapper) {
        const $icon = $wrapper.querySelector('.error-block-under-input__icon--animated');
        if (!$icon)
            return;
        this._cancelAnimations($icon);
        if (!this._canAnimate($icon))
            return;
        // Небольшое «качание» и вспышка прозрачности
        $icon.animate([
            { transform: 'rotate(0deg) scale(1)', opacity: 0 },
            { transform: 'rotate(-8deg) scale(1.05)', opacity: 1, offset: 0.15 },
            { transform: 'rotate(8deg)  scale(1.05)', opacity: 1, offset: 0.3 },
            { transform: 'rotate(-6deg) scale(1.03)', opacity: 1, offset: 0.45 },
            { transform: 'rotate(6deg)  scale(1.03)', opacity: 1, offset: 0.6 },
            { transform: 'rotate(0deg)  scale(1)', opacity: 0 },
        ], { duration: this._anim.iconDuration, easing: 'ease' });
    }
    /** Полностью снимает слушатели и чистит артефакты формы. */
    destroy() {
        // 1) Снять submit-слушатель
        if (this._onSubmitHandler) {
            this.$el.removeEventListener('submit', this._onSubmitHandler);
            this._onSubmitHandler = undefined;
        }
        // 1.1) Снять click-слушатель с кнопки submit
        if (this._onSubmitClickHandler) {
            this.$submits.forEach($submit => {
                $submit.removeEventListener('click', this._onSubmitClickHandler);
            });
            this._onSubmitClickHandler = undefined;
        }
        // 2) Удалить формовый error-блок под инпутами (если есть)
        const formErrorWrapper = this.$el.querySelector('.error-block-under-input__wrapper');
        if (formErrorWrapper) {
            this._cancelAnimations(formErrorWrapper);
            formErrorWrapper.remove();
        }
        // 3) Скрыть/удалить лоадер на кнопке submit
        this.$submits.forEach($submit => {
            $submit.classList.remove('button--loading');
            const btnLoader = $submit.querySelector('.button__loader');
            if (btnLoader)
                btnLoader.remove();
        });
        // 4) Сбросить ошибки у инпутов (если разметка позволяет)
        const inputs = this.$el.querySelectorAll('input, textarea, select');
        inputs.forEach($i => this.hideError($i));
        // 5) Убрать возможный флаг скролла
        document.documentElement.removeAttribute('data-now-scrolling');
        // 6) Очистить ссылки на элементы, чтобы помочь GC
        this.inputs = null;
        this.$submits = [];
        this.waitResponse = false;
    }
    /**
     * Проверяет входные данные на их корректность.
     *
     * @returns {boolean} Корректны данные или нет (true/false).
     */
    isCorrectArguments() {
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
    formDataToObject(formData) {
        const data = {};
        formData.forEach((value, key) => {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            }
            else {
                data[key] = value;
            }
        });
        return data;
    }
    appendFormDataValue(formData, key, value) {
        if (value === undefined || value === null)
            return;
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
    objectToFormData(data) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            this.appendFormDataValue(formData, key, value);
        });
        return formData;
    }
    stringifyFormDataValue(value) {
        return typeof value === 'string' ? value : value.name;
    }
    formDataToUrlSearchParams(formData) {
        const params = new URLSearchParams();
        formData.forEach((value, key) => {
            params.append(key, this.stringifyFormDataValue(value));
        });
        return params;
    }
    formDataToTextBody(formData) {
        return Array.from(formData)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(this.stringifyFormDataValue(value))}`)
            .join('\n');
    }
    isBodylessMethod(method) {
        return method === 'GET' || method === 'HEAD';
    }
    appendQueryString(action, params) {
        const query = params.toString();
        if (!query)
            return action;
        const separator = action.includes('?') ? '&' : '?';
        return `${action}${separator}${query}`;
    }
    findFieldByName(name) {
        const fields = Array.from(this.$el.querySelectorAll('input, textarea, select'));
        return fields.find($field => $field.name === name) || null;
    }
    parseResponseBody(response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const responseBody = yield response.json();
                return responseBody && typeof responseBody === 'object'
                    ? responseBody
                    : {
                        success: false,
                        error: true,
                        'error-msg': 'Некорректный ответ сервера',
                    };
            }
            catch (_a) {
                return {
                    success: false,
                    error: true,
                    'error-msg': 'Некорректный ответ сервера',
                };
            }
        });
    }
    handleUnsuccessfulResponse(responseBody) {
        if (responseBody.error !== true)
            return;
        if (responseBody['error-msg']) {
            this.showErrorForm(responseBody['error-msg']);
        }
        if (responseBody.errors) {
            const fieldsList = [];
            responseBody.errors.forEach(error => {
                const $field = this.findFieldByName(error.name);
                if ($field) {
                    fieldsList.push($field);
                    this.showError($field, error['error-msg']);
                }
                else {
                    console.warn(`Не найдено поле с именем: ${error.name}, для вывода ошибки: ${error['error-msg']}`);
                }
            });
            if (this.config.scrollToFirstErroredInput === true)
                this.scrollToFirstErroredInput(fieldsList);
        }
    }
    sendData() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const action = this.$el.getAttribute('action') || '';
            const method = ((_a = this.$el.getAttribute('method')) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'POST';
            const enctype = this.$el.getAttribute('enctype') || 'application/x-www-form-urlencoded';
            let body = null;
            let headers = {};
            // Сбор данных из формы
            const formData = serializeToFormData(this.$el);
            let data = this.formDataToObject(formData);
            if (this.config.logging) {
                for (const key of formData.keys())
                    console.log(formData.get(key));
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
        });
    }
    submit() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            if (!this.waitResponse) {
                if (this.config.showLoaderButton === true)
                    this.showLoader();
                (_b = (_a = this.config).onSubmit) === null || _b === void 0 ? void 0 : _b.call(_a, this);
                this.waitResponse = true;
                let loadingFinished = false;
                const finishLoading = () => {
                    if (loadingFinished)
                        return;
                    this.waitResponse = false;
                    if (this.config.showLoaderButton === true)
                        this.hideLoader();
                    loadingFinished = true;
                };
                try {
                    const response = yield this.sendData();
                    const responseBody = yield this.parseResponseBody(response);
                    finishLoading();
                    (_d = (_c = this.config).onResponse) === null || _d === void 0 ? void 0 : _d.call(_c, responseBody, this);
                    if (response.ok && responseBody.success === true) {
                        (_f = (_e = this.config).onResponseSuccess) === null || _f === void 0 ? void 0 : _f.call(_e, responseBody, this);
                    }
                    else {
                        (_h = (_g = this.config).onResponseUnsuccess) === null || _h === void 0 ? void 0 : _h.call(_g, responseBody, this);
                        this.handleUnsuccessfulResponse(responseBody);
                    }
                    parseCommonResponseProperties(responseBody);
                }
                catch (error) {
                    finishLoading();
                    throw error;
                }
            }
        });
    }
}

export { blockScrollBody, closest, Form as default, getAllValidators, getValidator, isEmailValid, isPhoneValid, isUrlValid, parseCommonResponseProperties, registerValidator, serializeFormToJSON, serializeToFormData, unblockScrollBody };
//# sourceMappingURL=index.js.map
