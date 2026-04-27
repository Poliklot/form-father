import Form from '../src/index';

const originalFetch = global.fetch;

function buildForm(markup: string): HTMLFormElement {
	document.body.innerHTML = markup;
	return document.getElementById('f') as HTMLFormElement;
}

function mockFetch(response: unknown = {}): jest.Mock {
	const fetchMock = jest.fn().mockResolvedValue(response as Response);
	global.fetch = fetchMock as any;
	return fetchMock;
}

function jsonResponse(body: unknown, status = 200): Response {
	return {
		status,
		ok: status >= 200 && status < 300,
		json: jest.fn().mockResolvedValue(body),
	} as any;
}

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
	global.fetch = originalFetch;
	document.body.innerHTML = '';
});

describe('Form submit buttons', () => {
	test('находит обычные submit-кнопки, implicit button и input image', () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper">
					<input name="email" type="email" class="input" value="test@example.com" />
				</div>
				<button id="implicit-submit">Implicit submit</button>
				<button type="button" id="plain-button">Plain button</button>
				<input type="image" id="image-submit" alt="Submit" />
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		const submitIds = (form as any).$submits.map(($submit: HTMLElement) => $submit.id);
		expect(submitIds).toEqual(['implicit-submit', 'image-submit']);
	});

	test('showLoader и hideLoader синхронизируются для всех submit-кнопок формы', () => {
		jest.useFakeTimers();

		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper">
					<input name="email" type="email" class="input" value="test@example.com" />
				</div>
				<button type="submit" id="desktop-submit">Desktop submit</button>
				<button type="submit" id="mobile-submit">Mobile submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		(form as any).showLoader();

		const buttons = Array.from(formEl.querySelectorAll<HTMLButtonElement>('button[type="submit"]'));
		expect(buttons).toHaveLength(2);

		buttons.forEach($button => {
			expect($button.classList.contains('button--loading')).toBe(true);
			expect($button.querySelector('.button__loader')).not.toBeNull();
		});

		const gradientIds = buttons.map($button => $button.querySelector('linearGradient')?.id);
		expect(new Set(gradientIds).size).toBe(buttons.length);

		(form as any).hideLoader();

		buttons.forEach($button => {
			expect($button.classList.contains('button--loading')).toBe(false);
		});

		jest.runAllTimers();

		buttons.forEach($button => {
			expect($button.querySelector('.button__loader')).toBeNull();
		});
	});

	test('wrapData применяется для application/x-www-form-urlencoded', async () => {
		const fetchMock = mockFetch();
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post" enctype="application/x-www-form-urlencoded">
				<div class="input__wrapper">
					<input name="email" type="email" class="input" value="test@example.com" />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			wrapData: data => ({ ...data, token: 'abc' }),
		});

		await (form as any).sendData();

		expect(fetchMock).toHaveBeenCalledWith('/submit', {
			method: 'POST',
			body: 'email=test%40example.com&token=abc',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});
	});

	test('wrapData применяется для multipart/form-data без ручного Content-Type', async () => {
		const fetchMock = mockFetch();
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post" enctype="multipart/form-data">
				<div class="input__wrapper">
					<input name="email" type="email" class="input" value="test@example.com" />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			wrapData: data => ({ ...data, token: 'abc' }),
		});

		await (form as any).sendData();

		const [, options] = fetchMock.mock.calls[0];
		expect(options.headers).toEqual({});
		expect(options.body).toBeInstanceOf(FormData);
		expect((options.body as FormData).get('email')).toBe('test@example.com');
		expect((options.body as FormData).get('token')).toBe('abc');
	});

	test('GET-форма отправляет данные в query string без body и Content-Type', async () => {
		const fetchMock = mockFetch();
		const formEl = buildForm(`
			<form id="f" action="/search?from=form" method="get">
				<div class="input__wrapper">
					<input name="q" type="text" class="input" value="Form Father" />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			wrapData: data => ({ ...data, page: 1 }),
		});

		await (form as any).sendData();

		expect(fetchMock).toHaveBeenCalledWith('/search?from=form&q=Form+Father&page=1', {
			method: 'GET',
			headers: {},
		});
	});

	test('application/json groups duplicate keys and logging prints form values', async () => {
		const fetchMock = mockFetch();
		const log = jest.spyOn(console, 'log').mockImplementation(() => {});
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post" enctype="application/json">
				<div class="input__wrapper">
					<input name="tag" class="input" value="one" />
					<input name="tag" class="input" value="two" />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			logging: true,
		});

		await (form as any).sendData();

		expect(log).toHaveBeenNthCalledWith(1, 'one');
		expect(log).toHaveBeenNthCalledWith(2, 'one');
		expect(fetchMock).toHaveBeenCalledWith('/submit', {
			method: 'POST',
			body: JSON.stringify({ tag: ['one', 'two'] }),
			headers: { 'Content-Type': 'application/json' },
		});
	});

	test('wrapData converts arrays, blobs and objects into multipart FormData', async () => {
		const fetchMock = mockFetch();
		const file = new Blob(['hello'], { type: 'text/plain' });
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post" enctype="multipart/form-data">
				<div class="input__wrapper">
					<input name="name" class="input" value="Ivan" />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			wrapData: data => ({
				...data,
				items: ['one', 'two'],
				file,
				meta: { source: 'test' },
				ignored: null,
			}),
		});

		await (form as any).sendData();

		const [, options] = fetchMock.mock.calls[0];
		const body = options.body as FormData;
		expect(body.get('name')).toBe('Ivan');
		expect(body.get('items[0]')).toBe('one');
		expect(body.get('items[1]')).toBe('two');
		expect(body.has('file')).toBe(true);
		expect(body.get('meta')).toBe(JSON.stringify({ source: 'test' }));
		expect(body.has('ignored')).toBe(false);
	});

	test.each([
		['text/plain', 'name=Ivan', { 'Content-Type': 'text/plain' }],
		['application/unknown', 'name=Ivan', { 'Content-Type': 'application/x-www-form-urlencoded' }],
	])('sendData supports %s enctype fallback', async (enctype, expectedBody, expectedHeaders) => {
		const fetchMock = mockFetch();
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post" enctype="${enctype}">
				<div class="input__wrapper">
					<input name="name" class="input" value="Ivan" />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		await (form as any).sendData();

		expect(fetchMock).toHaveBeenCalledWith('/submit', {
			method: 'POST',
			body: expectedBody,
			headers: expectedHeaders,
		});
		if (enctype === 'application/unknown') {
			expect(warn).toHaveBeenCalledWith(
				'Неизвестный enctype: application/unknown. Используется application/x-www-form-urlencoded.',
			);
		}
	});

	test('new Form(formEl) работает без обязательного options-объекта', () => {
		const formEl = buildForm(`
			<form id="f">
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl);

		expect(form.getOptions()).toEqual({});
	});

	test('submit вызывает onResponseUnsuccess для не-200 ответа и показывает ошибку textarea', async () => {
		mockFetch(
			jsonResponse(
				{
					success: false,
					error: true,
					'error-msg': 'Проверьте форму',
					errors: [{ name: 'comment', 'error-msg': 'Комментарий обязателен' }],
				},
				422,
			),
		);

		const onResponse = jest.fn();
		const onResponseSuccess = jest.fn();
		const onResponseUnsuccess = jest.fn();
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post">
				<div class="input__wrapper">
					<textarea name="comment" class="input"></textarea>
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			showLoaderButton: false,
			onResponse,
			onResponseSuccess,
			onResponseUnsuccess,
		});

		await (form as any).submit();

		const textarea = formEl.querySelector<HTMLTextAreaElement>('textarea[name="comment"]')!;
		expect(onResponse).toHaveBeenCalledWith(expect.objectContaining({ error: true }), form);
		expect(onResponseSuccess).not.toHaveBeenCalled();
		expect(onResponseUnsuccess).toHaveBeenCalledWith(expect.objectContaining({ error: true }), form);
		expect(textarea.getAttribute('aria-invalid')).toBe('true');
		expect(formEl.querySelector('[data-form-father-error]')?.textContent).toBe('Комментарий обязателен');
		expect(formEl.querySelector('.error-block-under-input__main-text')?.textContent).toBe('Проверьте форму');
	});

	test('submit warns when server returns field error for missing control', async () => {
		mockFetch(
			jsonResponse({
				success: false,
				error: true,
				errors: [{ name: 'missing', 'error-msg': 'Missing field' }],
			}),
		);
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post">
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			showLoaderButton: false,
			scrollToFirstErroredInput: false,
		});

		await (form as any).submit();

		expect(warn).toHaveBeenCalledWith('Не найдено поле с именем: missing, для вывода ошибки: Missing field');
	});

	test('submit обрабатывает невалидный JSON как неуспешный ответ', async () => {
		mockFetch({
			status: 500,
			ok: false,
			json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
		});

		const onResponse = jest.fn();
		const onResponseUnsuccess = jest.fn();
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post">
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			showLoaderButton: false,
			scrollToFirstErroredInput: false,
			onResponse,
			onResponseUnsuccess,
		});

		await (form as any).submit();

		expect(onResponse).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				error: true,
				'error-msg': 'Некорректный ответ сервера',
			}),
			form,
		);
		expect(onResponseUnsuccess).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				error: true,
				'error-msg': 'Некорректный ответ сервера',
			}),
			form,
		);
		expect(formEl.querySelector('.error-block-under-input__main-text')?.textContent).toBe(
			'Некорректный ответ сервера',
		);
	});

	test('submit снимает loader и waitResponse при ошибке fetch', async () => {
		jest.useFakeTimers();
		global.fetch = jest.fn().mockRejectedValue(new Error('Network fail')) as any;

		const formEl = buildForm(`
			<form id="f" action="/submit" method="post">
				<div class="input__wrapper">
					<input name="email" type="email" class="input" value="test@example.com" />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);

		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		await expect((form as any).submit()).rejects.toThrow('Network fail');

		const button = formEl.querySelector<HTMLButtonElement>('button[type="submit"]')!;
		expect((form as any).waitResponse).toBe(false);
		expect(button.classList.contains('button--loading')).toBe(false);

		jest.runAllTimers();
		expect(button.querySelector('.button__loader')).toBeNull();
	});
});
