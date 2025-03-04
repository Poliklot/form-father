/**
 * Возвращает форматированную дату.
 *
 * @param {string} dateValue
 * @param {string} format
 *
 * @returns {string}
 */
function formatDate(dateValue: string, format: string): string {
	const date = new Date(dateValue);

	/**
	 * Добавляет ведущие нули.
	 *
	 * @param {number} num
	 *
	 * @returns {string}
	 */
	const pad = (num: number): string => num.toString().padStart(2, '0');

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
export function closest($el: HTMLElement | null, selector: string): HTMLElement | null {
	if ($el == null) return null;

	let parent: HTMLElement | null = $el;

	while (parent) {
		if (parent.matches(selector)) {
			return parent;
		}

		parent = parent.parentElement;
	}

	return null;
}

/** Включает блокировку скролла страницы */
export function blockScrollBody(): void {
	(window as any).lastBlockScrollPosition = window.pageYOffset;
	document.body.style.top = `${-(window as any).lastBlockScrollPosition}px`;
	document.body.classList.add('body--block-scroll');
}

/** Отменяет блокировку скролла страницы */
export function unblockScrollBody(): void {
	document.body.classList.remove('body--block-scroll');
	document.body.style.top = '';
	window.scrollTo(0, (window as any).lastBlockScrollPosition || 0);
}

/**
 * Проверяет является ли строка валидным адресом электронной почты.
 *
 * @param {string} value - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным адресом электронной почты true/false.
 */
export function isEmailValid(value: string): boolean {
	return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu.test(
		value,
	);
}

/**
 * Проверяет является ли строка валидным url.
 *
 * @param {string} originalUrlString - Строка, которую нужно проверить.
 *
 * @returns {boolean} Является ли строка валидным url адресом true/false.
 */
export function isUrlValid(originalUrlString: string): boolean {
	const urlString = /^https?:\/\//i.test(originalUrlString) ? originalUrlString : `http://${originalUrlString}`;

	try {
		new URL(urlString);
		return true;
	} catch (e) {
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
export function isPhoneValid(value: string): boolean {
	const numbersArray: string[] = [];

	Array.from(value).forEach(char => {
		if (!!Number(char) || Number(char) === 0) numbersArray.push(char);
	});
	if (numbersArray.length < 11 || (numbersArray.length < 12 && value[1] === '+')) return false;

	return true;
}

/**
 * Кастомная сериализация формы в объект FormData.
 *
 * @param {HTMLElement} $element - DOM элемент для сериализации.
 *
 * @returns {FormData} Сериализованные данные формы в объекте FormData.
 */
export function serializeToFormData($element: HTMLElement): FormData {
	const elements =
		$element.tagName === 'FORM'
			? Array.from(($element as HTMLFormElement).elements)
			: Array.from($element.querySelectorAll('input, select, textarea, button'));

	const data = new FormData();

	elements.forEach(element => {
		if (
			!(
				element instanceof HTMLInputElement ||
				element instanceof HTMLSelectElement ||
				element instanceof HTMLTextAreaElement ||
				element instanceof HTMLButtonElement
			)
		) {
			return;
		}

		if (!element.name || element.hasAttribute('data-no-serialize')) {
			return;
		}
		const { name, type } = element;

		if (type === 'file') {
			if (element.getAttribute('multiple') === 'true') {
				const files = (element as HTMLInputElement).files;
				if (files) {
					for (let i = 0; i < files.length; i++) {
						// Добавляем каждый файл с уникальным ключом
						data.append(`${name}[${i}]`, files[i]);
					}
				}
			} else {
				const files = (element as HTMLInputElement).files;
				if (files && files[0]) data.append(name, files[0]);
			}
		} else {
			let value: string;
			if (type === 'select-one' || type === 'select-multiple') {
				// Обработка select элементов
				const select = element as HTMLSelectElement;
				if (type === 'select-multiple') {
					const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
					selectedOptions.forEach((val, index) => {
						data.append(`${name}[${index}]`, val);
					});
				} else {
					value = select.value;
					if (value) data.append(name, value);
				}
			} else if (type === 'tel') {
				value = element.value
					.split(/[\s()-]/)
					.join('')
					.replace(/^8/, '+7');
			} else if (type === 'checkbox' || type === 'radio') {
				if (!(element as HTMLInputElement).checked) return;
				value = element.value;
			} else if (type === 'date') {
				const format = element.getAttribute('data-date-format');
				value = format ? formatDate(element.value, format) : element.value;
			} else {
				value = element.value;
			}

			if (value! && type !== 'select-one' && type !== 'select-multiple') {
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
export function parseCommonResponseProperties(responseBody: any): void {
	if (Object.prototype.hasOwnProperty.call(responseBody, 'redirect-url')) {
		window.location.href = responseBody['redirect-url'];
	}
	if (Object.prototype.hasOwnProperty.call(responseBody, 'reload')) {
		if (responseBody.reload === true) window.location.reload();
	}
	if (Object.prototype.hasOwnProperty.call(responseBody, 'error-toast')) {
		const $formErrorToast = document.querySelector('[data-toast-name="formErrorToast"]');
		if ($formErrorToast) {
			const $toastText = $formErrorToast.querySelector('.toast__text');
			if ($toastText) {
				$toastText.textContent = responseBody['error-toast'];
				(window as any).Toast.showToast('formErrorToast', {
					removeAfterClose: false,
				});
			}
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
export function serializeFormToJSON(form: HTMLFormElement): { [key: string]: any } {
	const obj: { [key: string]: any } = {};
	const formData = new FormData(form);

	formData.forEach((value, key) => {
		if (obj.hasOwnProperty(key)) {
			if (!Array.isArray(obj[key])) {
				obj[key] = [obj[key]];
			}
			obj[key].push(value);
		} else {
			obj[key] = value;
		}
	});

	return obj;
}
