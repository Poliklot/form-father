export * from './validators';
export { serializeToFormData, isEmailValid, isUrlValid, parseCommonResponseProperties, closest, isPhoneValid, blockScrollBody, unblockScrollBody, serializeFormToJSON, } from './helpers';
export type ValidationRule = string | {
    rule: string;
    params?: any;
};
export type ValidationSchema = Record<string, {
    rules: ValidationRule[];
    selector?: string;
    messages?: Record<string, string>;
}>;
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
/**
 * Реализует форму отправки данных.
 *
 * @class
 */
export default class Form {
    $el: HTMLFormElement;
    private options;
    private config;
    private $submits;
    private waitResponse;
    private inputs;
    private _onSubmitHandler?;
    private _onSubmitClickHandler?;
    private static get defaultParams();
    private static set defaultParams(value);
    static get defaultValidationSchema(): ValidationSchema;
    static set defaultValidationSchema(v: ValidationSchema);
    /**
     * Создать форму.
     *
     * @param {HTMLElement} $el - Элемент формы (тег form!).
     * @param {Object} options - Параметры формы.
     */
    constructor($el: HTMLElement, options?: FormOptions);
    getOptions(): FormOptions;
    /**
     * Обновляет параметры по умолчанию для настроек формы. Метод объединяет переданные параметры с уже существующими
     * параметрами по умолчанию.
     *
     * @param {Partial<FormOptions>} params - Объект, содержащий новые значения параметров. Можно передать только те
     *   свойства, которые необходимо обновить; остальные сохранятся без изменений.
     */
    static setDefaultParams(params: Partial<FormOptions>): void;
    private findSubmitElements;
    private initialization;
    /**
     * Показывает ошибку для поля ввода.
     *
     * @param {HTMLInputElement} $input - Поле ввода.
     * @param {String} text - Текст ошибки.
     */
    private showError;
    /** Показывает лоадер */
    private showLoader;
    /** Скрывает лоадер */
    private hideLoader;
    /**
     * Скрывает ошибку.
     *
     * @param {HTMLInputElement} $input - Поле ввода.
     */
    private hideError;
    /**
     * Проскроливает до первого ошибочного поля.
     *
     * @param {HTMLElement[]} inputsList - Массив элементов с ошибкой.
     */
    private scrollToFirstErroredInput;
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
    validate($block?: HTMLElement): Promise<boolean>;
    /** Блокирует кнопку отправки данных. */
    private disableSubmit;
    /** Снимает блокировку с кнопки отправки данных. */
    private enableSubmit;
    /** Очищает поля ввода формы. */
    clearInputs(): void;
    /** Общие настройки анимаций (можно подправить под вкус) */
    private readonly _anim;
    private _prefersReducedMotion;
    private _canAnimate;
    private _cancelAnimations;
    /**
     * Показывает ошибку под полями ввода - ошибку, относящуюся ко всей форме.
     *
     * @param {String} text - Текст ошибки.
     */
    private showErrorForm;
    /** Скрывает ошибку под полями ввода - ошибку, относящуюся ко всей форме. */
    private hideErrorForm;
    /** Короткая анимация иконки без CSS */
    private _ringIcon;
    /** Полностью снимает слушатели и чистит артефакты формы. */
    destroy(): void;
    /**
     * Проверяет входные данные на их корректность.
     *
     * @returns {boolean} Корректны данные или нет (true/false).
     */
    private isCorrectArguments;
    private formDataToObject;
    private appendFormDataValue;
    private objectToFormData;
    private stringifyFormDataValue;
    private formDataToUrlSearchParams;
    private formDataToTextBody;
    private isBodylessMethod;
    private appendQueryString;
    private findFieldByName;
    private parseResponseBody;
    private handleUnsuccessfulResponse;
    private sendData;
    private submit;
}
