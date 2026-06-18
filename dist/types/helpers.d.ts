/**
 * Находит родительский элемент по заданому селектору.
 *
 * @param {HTMLElement | null} $el - Элемент, чего родителя нужно найти.
 * @param {string} selector - Селектор родителя.
 *
 * @returns {HTMLElement | null} Элемент родителя. Но если родителя с таким селектори не было найдено возвращается null.
 */
export declare function closest($el: HTMLElement | null, selector: string): HTMLElement | null;
/** Включает блокировку скролла страницы */
export declare function blockScrollBody(): void;
/** Отменяет блокировку скролла страницы */
export declare function unblockScrollBody(): void;
/**
 * Проверяет является ли строка валидным адресом электронной почты.
 *
 * @param {string} value - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным адресом электронной почты true/false.
 */
export declare function isEmailValid(value: string): boolean;
/**
 * Проверяет является ли строка валидным url.
 *
 * @param {string} originalUrlString - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным url адресом true/false.
 */
export declare function isUrlValid(originalUrlString: string): boolean;
/**
 * Проверяет является ли строка валидным номером телефона.
 *
 * @param {string} value - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным номером телефона true/false.
 */
export declare function isPhoneValid(value: string): boolean;
/**
 * Кастомная сериализация формы в объект FormData.
 *
 * @param {HTMLElement} $element - DOM элемент для сериализации.
 *
 * @returns {FormData} Сериализованные данные формы в объекте FormData.
 */
export declare function serializeToFormData($element: HTMLElement): FormData;
/**
 * Функция для разбора общих свойств ответа.
 *
 * @param {any} responseBody - Тело ответа.
 */
export declare function parseCommonResponseProperties(responseBody: any): void;
/**
 * Сериализует данные формы в объект JSON.
 *
 * @param {HTMLFormElement} form - Элемент формы.
 *
 * @returns {Object} Сериализованные данные формы.
 */
export declare function serializeFormToJSON<T extends Record<string, any> = Record<string, any>>(form: HTMLFormElement): T;
