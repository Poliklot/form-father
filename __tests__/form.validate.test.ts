/** Мини-DOM:<form id="f"> <div class="input__wrapper"> <input name="email" type="email" class="input" /> </div></form> */

import { getAllValidators, getValidator, registerValidator } from '../src/validators';
import Form from '../src/index';

beforeAll(() => {
	// кастомный валидатор для проверки async-ветки
	registerValidator('begin+79277', async v => /^\+79277\d{6}$/.test(v), 'Номер должен начинаться на +79277');
});

function buildForm(markup: string): HTMLFormElement {
	document.body.innerHTML = markup;
	return document.getElementById('f') as HTMLFormElement;
}

afterEach(() => {
	jest.restoreAllMocks(); // сбрасывает все spy
});

describe('Form.validate()', () => {
	test('Поле email required не заполнено, проверка дефолтной ошибки', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="email" type="email" class="input" required/>
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		// «подглядываем» за приватным методом
		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Пустое значение');
	});

	test('Поле email required не заполнено', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="email" type="email" class="input" required/>
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			validationSchema: {
				email: {
					selector: '[type="email"]',
					rules: ['email'],
					messages: {
						required: 'Обязательное поле (test)',
						email: 'Введите корректный e-mail',
					},
				},
			},
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		// «подглядываем» за приватным методом
		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Обязательное поле (test)');
	});

	test('Поле email не заполнено', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="email" type="email" class="input"/>
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			validationSchema: {
				email: {
					selector: '[type="email"]',
					rules: ['email'],
					messages: {
						required: 'Обязательное поле',
						email: 'Введите корректный e-mail',
					},
				},
			},
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		// «подглядываем» за приватным методом
		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	test('Поле email заполнено не правильно', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="email" type="email" class="input" value="@@" required/>
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			validationSchema: {
				email: {
					selector: '[type="email"]',
					rules: ['email'],
					messages: {
						required: 'Обязательное поле',
						email: 'Введите корректный e-mail',
					},
				},
			},
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		// «подглядываем» за приватным методом
		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Введите корректный e-mail');
	});

	test('Поле tel заполнено правильно', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="tel" type="tel" value="+79277123456" class="input" />
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			validationSchema: {
				tel: {
					selector: '[type="tel"]',
					rules: ['tel', 'begin+79277'],
				},
			},
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	test('Поле tel заполнено не правильно: кастомный валидатор через data-атриубт', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="tel" type="tel" value="+79127712345" data-custom-validate="begin+79277" class="input" />
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Номер должен начинаться на +79277');
	});

	test('Переопределен валидатор без override', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="tel" type="tel" value="+79127712345" class="input" />
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		const mockWarn = jest.spyOn(console, 'warn');

		registerValidator('tel', v => /^8\d{10}$/.test(v), 'Неверный формат (test)');
		expect(mockWarn).toHaveBeenCalledWith(
			'[FormFather] Validator "tel" already exists; pass { override: true } to replace',
		);
	});

	test('Поле email заполнено не правильно: Переопределение только текста ошибки', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="email" type="email" class="input" value="@@" required/>
                </div>
                <button type="submit"></button>
            </form>
        `);

		const tel = getValidator('email');
		if (tel) tel.defaultMessage = 'Введите корректный e-mail(новое)';

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		// «подглядываем» за приватным методом
		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Введите корректный e-mail(новое)');
	});

	test('Переопределен валидатор: tel заполнено не правильно', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="tel" type="tel" value="+79127712345" class="input" />
                </div>
                <button type="submit"></button>
            </form>
        `);

		registerValidator('tel', v => /^8\d{10}$/.test(v), 'Неверный формат (test)', { override: true });

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		const result = await (form as any).validate();
		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Неверный формат (test)');
	});

	test('Поле с несуществующим кастомным валидатор через data-атриубут', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="tel" type="tel" value="+79127712345" data-custom-validate="unknow" class="input" />
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});
		const mockWarn = jest.spyOn(console, 'warn');

		await (form as any).validate();
		expect(spy).toHaveBeenCalledTimes(1);
		expect(mockWarn).toHaveBeenCalledWith('[FormFather] Unknown validation rule "unknow"');
	});

	test('Проверка вывода всех валидаторов', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="input__wrapper">
                    <input name="tel" type="tel" value="+79127712345" data-custom-validate="unknow" class="input" />
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});
		const mockLog = jest.spyOn(console, 'log');
		const all = getAllValidators();
		console.log(JSON.stringify([...all.keys()]));
		await (form as any).validate();

		expect(mockLog).toHaveBeenCalledWith('["required","email","tel","url","not-numbers","begin+79277"]');
	});

	test('Required checkbox не выборан', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="checkbox__wrapper">
                    <input id="formAuthorize-checkboxUserAgreement" class="checkbox input" type="checkbox" name="checkboxUserAgreement" value="off" required>
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper, .checkbox__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});
		await (form as any).validate();

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Пустое значение');
	});

	test('Required checkbox выборан', async () => {
		const formEl = buildForm(`
            <form id="f">
                <div class="checkbox__wrapper">
                    <input id="formAuthorize-checkboxUserAgreement" class="checkbox input" type="checkbox" name="checkboxUserAgreement" value="off" checked required>
                </div>
                <button type="submit"></button>
            </form>
        `);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper, .checkbox__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});
		const result = await (form as any).validate();
		expect(result).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	/* TODO: Должна быть 1 ошибка на группу - доработать. */
	test('Required radio не выбран — вызывает ошибку', async () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="radio__wrapper">
					<input type="radio" name="gender" value="male" class="radio input" required />
					<input type="radio" name="gender" value="female" class="radio input" required />
				</div>
				<button type="submit"></button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper, .radio__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});
		const result = await (form as any).validate();

		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Пустое значение');
	});

	test('Required radio выбран — проходит валидацию', async () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="radio__wrapper">
					<input type="radio" name="gender" value="male" class="radio input" required />
					<input type="radio" name="gender" value="female" class="radio input" required checked />
				</div>
				<button type="submit"></button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper, .radio__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});
		const result = await (form as any).validate();

		expect(result).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	test('Required radio (одна кнопка в группе) — срабатывает корректно', async () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="radio__wrapper">
					<input type="radio" name="notify" value="yes" class="radio input" required />
				</div>
				<button type="submit"></button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.radio__wrapper',
			scrollToFirstErroredInput: false,
		});

		const spy = jest.spyOn(form as any, 'showError').mockImplementation(() => {});
		const result = await (form as any).validate();

		expect(result).toBe(false);
		expect(spy).toHaveBeenCalledTimes(1); // только один элемент в группе
		expect(spy).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Пустое значение');
	});
});

/**
 * Проверяем, что Map валидаторов лежит на globalThis и переопределение из второй «копии» модуля реально заменяет
 * валидатор для всех.
 */
describe('validators – singleton-хранилище', () => {
	test('Переопределение валидатора в другой копии модуля видно глобально', async () => {
		// 1. Чистим кеш модулей, чтобы импортировать "две копии"
		jest.resetModules();

		// 2. Импорт №1 и регистрируем базовый валидатор 'foo'
		const { registerValidator, getValidator } = await import('../src/validators');
		registerValidator('foo', () => true, 'v1');

		const first = getValidator('foo');
		expect(first?.defaultMessage).toBe('v1');

		// 3. Импорт №2 — эмулируем вторую копию после resetModules
		const { registerValidator: reg2, getValidator: get2 } = await import('../src/validators');

		// переопределяем
		reg2('foo', () => false, 'v2', { override: true });

		// 4. Оба импорта должны видеть один и тот же объект
		expect(getValidator('foo')?.defaultMessage).toBe('v2'); // из первой копии
		expect(get2('foo')?.defaultMessage).toBe('v2'); // из второй копии

		// и Map действительно один и тот же
		expect(getValidator('foo')).toBe(get2('foo'));
	});
});
