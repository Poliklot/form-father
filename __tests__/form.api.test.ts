import Form, { registerValidator } from '../src/index';

const originalFetch = global.fetch;

function buildForms(markup: string): void {
	document.body.innerHTML = markup;
}

function jsonResponse(body: unknown, status = 200): Response {
	return {
		status,
		ok: status >= 200 && status < 300,
		json: jest.fn().mockResolvedValue(body),
	} as any;
}

function mockFetch(response: unknown): jest.Mock {
	const fetchMock = jest.fn().mockResolvedValue(response as Response);
	global.fetch = fetchMock as any;
	return fetchMock;
}

async function flushAsyncValidation(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
	global.fetch = originalFetch;
	document.body.innerHTML = '';
	Form.setDefaultParams({
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
	});
});

describe('Form public API conveniences', () => {
	test('initAll creates instances once and updates existing instances', () => {
		buildForms(`
			<form id="first" data-form-father><button type="submit"></button></form>
			<form id="second" data-form-father><button type="submit"></button></form>
			<form id="ignored"><button type="submit"></button></form>
		`);

		const forms = Form.initAll(undefined as any, { scrollToFirstErroredInput: false });
		expect(forms).toHaveLength(2);
		expect((forms[0] as any).config.scrollToFirstErroredInput).toBe(false);

		const again = Form.initAll('form[data-form-father]', { loaderColor: 'currentColor' });
		expect(again).toEqual(forms);
		expect((forms[0] as any).config.loaderColor).toBe('currentColor');
	});

	test('data-validate, data-error-* and data-error-container drive field validation', async () => {
		buildForms(`
			<form id="f">
				<label class="field">
					<input
						name="email"
						class="input"
						value="bad"
						data-validate="required|email"
						data-error-email="Email from data attr"
						data-error-container="#email-error"
					/>
				</label>
				<div id="email-error"></div>
				<button type="submit"></button>
			</form>
		`);
		const formEl = document.getElementById('f') as HTMLFormElement;
		const form = new Form(formEl, {
			inputWrapperSelector: '.missing',
			scrollToFirstErroredInput: false,
		});

		expect(await form.validateField('email')).toBe(false);
		expect(form.getErrors()).toEqual([
			{ field: 'email', rule: 'email', message: 'Email from data attr', source: 'client' },
		]);
		expect(document.getElementById('email-error')?.textContent).toBe('Email from data attr');
		expect(document.getElementById('email-error')?.hasAttribute('hidden')).toBe(false);

		const input = formEl.querySelector<HTMLInputElement>('input[name="email"]')!;
		input.value = 'good@example.com';

		expect(await form.validateField(input)).toBe(true);
		expect(form.getErrors()).toEqual([]);
		expect(document.getElementById('email-error')?.textContent).toBe('');
		expect(document.getElementById('email-error')?.hasAttribute('hidden')).toBe(true);
	});

	test('showFieldError records manual/server-style errors and warns for missing fields', async () => {
		buildForms(`
			<form id="f">
				<div class="input__wrapper"><input name="name" class="input" /></div>
				<button type="submit"></button>
			</form>
		`);
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const form = new Form(document.getElementById('f') as HTMLFormElement, {
			inputWrapperSelector: '.input__wrapper',
		});

		expect(form.showFieldError('name', 'Name is busy', 'server')).toBe(true);
		expect(form.getErrors()).toEqual([{ field: 'name', rule: 'server', message: 'Name is busy', source: 'server' }]);
		expect(document.querySelector('[data-form-father-error]')?.textContent).toBe('Name is busy');

		expect(form.showFieldError('missing', 'Missing')).toBe(false);
		expect(warn).toHaveBeenCalledWith('[FormFather] Field "missing" not found');

		expect(await form.validateField('missing')).toBe(false);
		expect(warn).toHaveBeenCalledWith('[FormFather] Field "missing" not found');
	});

	test('validateOn and debounced revalidateOn validate fields during interaction', async () => {
		jest.useFakeTimers();
		buildForms(`
			<form id="f">
				<div class="input__wrapper">
					<input name="code" class="input" value="x" data-validate="required|digits-3" />
				</div>
				<button type="submit"></button>
			</form>
		`);
		registerValidator('digits-3', value => /^\d{3}$/.test(value), 'Need 3 digits', { override: true });
		const formEl = document.getElementById('f') as HTMLFormElement;
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			validateOn: ['blur'],
			revalidateOn: ['input'],
			validationDebounce: 25,
		});
		const input = formEl.querySelector<HTMLInputElement>('input[name="code"]')!;

		input.dispatchEvent(new Event('input'));
		jest.advanceTimersByTime(25);
		await flushAsyncValidation();
		expect(form.getErrors()).toEqual([]);

		input.dispatchEvent(new Event('blur'));
		jest.advanceTimersByTime(25);
		await flushAsyncValidation();
		expect(form.getErrors()[0]).toEqual({ field: 'code', rule: 'digits-3', message: 'Need 3 digits', source: 'client' });

		input.value = '123';
		input.dispatchEvent(new Event('input'));
		jest.advanceTimersByTime(25);
		await flushAsyncValidation();
		expect(form.getErrors()).toEqual([]);
	});

	test('async field validation marks state and ignores stale results', async () => {
		const pending = new Map<string, (valid: boolean) => void>();
		registerValidator(
			'slow-check',
			value =>
				new Promise<boolean>(resolve => {
					pending.set(value, resolve);
				}),
			'Slow check failed',
			{ override: true },
		);
		buildForms(`
			<form id="f">
				<div class="input__wrapper">
					<input name="code" class="input" value="bad" data-validate="slow-check" />
				</div>
				<button type="submit"></button>
			</form>
		`);
		const formEl = document.getElementById('f') as HTMLFormElement;
		const input = formEl.querySelector<HTMLInputElement>('input[name="code"]')!;
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			validationStateAttribute: 'data-state',
		});

		const staleValidation = form.validateField('code');
		expect(input.getAttribute('aria-busy')).toBe('true');
		expect(input.getAttribute('data-state')).toBe('validating');

		input.value = 'good';
		const latestValidation = form.validateField(input);

		pending.get('bad')?.(false);
		await staleValidation;
		expect(form.getErrors()).toEqual([]);
		expect(input.getAttribute('aria-busy')).toBe('true');
		expect(input.getAttribute('data-state')).toBe('validating');

		pending.get('good')?.(true);
		await expect(latestValidation).resolves.toBe(true);
		expect(form.getErrors()).toEqual([]);
		expect(input.hasAttribute('aria-busy')).toBe(false);
		expect(input.getAttribute('data-state')).toBe('valid');

		input.value = 'bad-again';
		const failedValidation = form.validateField('code');
		pending.get('bad-again')?.(false);
		await expect(failedValidation).resolves.toBe(false);
		expect(form.getErrors()).toEqual([
			{ field: 'code', rule: 'slow-check', message: 'Slow check failed', source: 'client' },
		]);
		expect(input.getAttribute('data-state')).toBe('invalid');

		form.clearErrors();
		expect(input.hasAttribute('data-state')).toBe(false);
		expect(input.hasAttribute('aria-busy')).toBe(false);
	});

	test('async field validation clears pending state when validator throws', async () => {
		registerValidator(
			'throws-async',
			async () => {
				throw new Error('validator exploded');
			},
			'Exploded',
			{ override: true },
		);
		buildForms(`
			<form id="f">
				<div class="input__wrapper">
					<input name="code" class="input" value="x" data-validate="throws-async" />
				</div>
				<button type="submit"></button>
			</form>
		`);
		const formEl = document.getElementById('f') as HTMLFormElement;
		const input = formEl.querySelector<HTMLInputElement>('input[name="code"]')!;
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		await expect(form.validateField('code')).rejects.toThrow('validator exploded');
		expect(input.hasAttribute('aria-busy')).toBe(false);
		expect(input.hasAttribute('data-form-father-state')).toBe(false);
	});

	test('updateOptions rebinds live validation events', async () => {
		buildForms(`
			<form id="f">
				<div class="input__wrapper"><input name="email" class="input" value="bad" data-validate="email" /></div>
				<button type="submit"></button>
			</form>
		`);
		const formEl = document.getElementById('f') as HTMLFormElement;
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			validateOn: 'submit',
		});
		const input = formEl.querySelector<HTMLInputElement>('input[name="email"]')!;

		input.dispatchEvent(new Event('blur'));
		await flushAsyncValidation();
		expect(form.getErrors()).toEqual([]);

		form.updateOptions({ validateOn: 'blur' });
		input.dispatchEvent(new Event('blur'));
		await flushAsyncValidation();
		expect(form.getErrors()[0].field).toBe('email');
	});

	test('onValidationError, focusFirstErroredInput and onBeforeSubmit hooks are exposed', async () => {
		const fetchMock = mockFetch(jsonResponse({ success: true }));
		buildForms(`
			<form id="f" action="/submit" method="post">
				<div class="input__wrapper"><input name="email" class="input" required /></div>
				<button type="submit"></button>
			</form>
		`);
		const formEl = document.getElementById('f') as HTMLFormElement;
		const onValidationError = jest.fn();
		const focus = jest.spyOn(formEl.querySelector<HTMLInputElement>('input[name="email"]')!, 'focus').mockImplementation(
			() => {},
		);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			focusFirstErroredInput: true,
			onValidationError,
		});

		await (form as any)._onSubmitHandler({ preventDefault: jest.fn() } as any);

		expect(onValidationError).toHaveBeenCalledWith(
			[{ field: 'email', rule: 'required', message: expect.any(String), source: 'client' }],
			form,
		);
		expect(focus).toHaveBeenCalledWith({ preventScroll: true });
		expect(fetchMock).not.toHaveBeenCalled();

		const laterInput = document.createElement('input');
		laterInput.name = 'later';
		laterInput.className = 'input';
		formEl.appendChild(laterInput);
		(form as any).focusFirstErroredInput([laterInput, formEl.querySelector<HTMLInputElement>('input[name="email"]')!]);
		expect(focus).toHaveBeenCalledTimes(2);

		const beforeForm = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			showLoaderButton: false,
			onBeforeSubmit: () => false,
		});
		formEl.querySelector<HTMLInputElement>('input[name="email"]')!.value = 'ok';

		await expect(beforeForm.submit()).resolves.toEqual({ success: false });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test('submit returns success metadata and calls onSubmitError before rethrowing network errors', async () => {
		mockFetch(jsonResponse({ success: true }));
		buildForms(`
			<form id="f" action="/submit" method="post">
				<div class="input__wrapper"><input name="name" class="input" value="Ivan" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(document.getElementById('f') as HTMLFormElement, {
			inputWrapperSelector: '.input__wrapper',
			showLoaderButton: false,
		});

		await expect(form.submit()).resolves.toEqual({
			success: true,
			response: expect.any(Object),
			responseBody: { success: true },
		});

		(form as any).waitResponse = true;
		await expect(form.submit()).resolves.toBeUndefined();

		const error = new Error('offline');
		global.fetch = jest.fn().mockRejectedValue(error) as any;
		(form as any).waitResponse = false;
		const onSubmitError = jest.fn();
		form.updateOptions({ onSubmitError });

		await expect(form.submit()).rejects.toThrow('offline');
		expect(onSubmitError).toHaveBeenCalledWith(error, form);

		const beforeError = new Error('before failed');
		form.updateOptions({
			onBeforeSubmit: () => {
				throw beforeError;
			},
		});
		await expect(form.submit()).rejects.toThrow('before failed');
		expect(onSubmitError).toHaveBeenCalledWith(beforeError, form);
	});

	test('getValues, setValues, clearErrors and reset manage form state ergonomically', async () => {
		buildForms(`
			<form id="f">
				<div class="input__wrapper"><input name="name" class="input" value="Initial" required /></div>
				<label><input name="agree" class="input" type="checkbox" value="yes" /></label>
				<label><input name="role" class="input" type="radio" value="user" checked /></label>
				<label><input name="role" class="input" type="radio" value="admin" /></label>
				<select name="tags" class="input" multiple>
					<option value="a">A</option>
					<option value="b">B</option>
				</select>
				<input name="avatar" class="input" type="file" />
				<button type="submit"></button>
			</form>
		`);
		const formEl = document.getElementById('f') as HTMLFormElement;
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});
		const inputEvents = jest.fn();
		formEl.addEventListener('input', inputEvents);

		form.setValues({
			name: 'Ada',
			agree: true,
			role: 'admin',
			tags: ['a', 'b'],
			avatar: 'ignored',
			missing: 'ignored',
		});

		expect(formEl.querySelector<HTMLInputElement>('input[name="name"]')!.value).toBe('Ada');
		expect(formEl.querySelector<HTMLInputElement>('input[name="agree"]')!.checked).toBe(true);
		form.setValues({ agree: ['yes'] });
		expect(formEl.querySelector<HTMLInputElement>('input[name="agree"]')!.checked).toBe(true);
		expect(formEl.querySelector<HTMLInputElement>('input[name="role"][value="admin"]')!.checked).toBe(true);
		expect(Array.from(formEl.querySelector<HTMLSelectElement>('select[name="tags"]')!.selectedOptions).map(o => o.value)).toEqual([
			'a',
			'b',
		]);
		expect(inputEvents).toHaveBeenCalled();
		expect(form.getValues()).toMatchObject({
			name: 'Ada',
			agree: 'yes',
			role: 'admin',
			tags: ['a', 'b'],
		});

		form.showFieldError('name', 'Bad name');
		expect(form.getErrors()).toHaveLength(1);
		expect(form.clearErrors()).toBe(form);
		expect(form.getErrors()).toEqual([]);
		expect(formEl.querySelector('[data-form-father-error]')).toBeNull();

		form.setValues({ name: 'Grace', agree: false, role: 'user', tags: [] });
		form.showFieldError('name', 'Reset me');
		expect(form.reset()).toBe(form);
		expect(formEl.querySelector<HTMLInputElement>('input[name="name"]')!.value).toBe('Initial');
		expect(form.getErrors()).toEqual([]);

		form.showFieldError('name', 'Keep me');
		form.setValues({ name: 'Changed' });
		form.reset({ clearErrors: false });
		expect(form.getErrors()).toEqual([{ field: 'name', rule: 'manual', message: 'Keep me', source: 'manual' }]);
	});

	test('observeMutations refreshes dynamic controls', async () => {
		buildForms(`
			<form id="f">
				<button type="submit"></button>
			</form>
		`);
		const formEl = document.getElementById('f') as HTMLFormElement;
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			observeMutations: true,
			validateOn: 'input',
		});

		const wrapper = document.createElement('div');
		wrapper.className = 'input__wrapper';
		wrapper.innerHTML = '<input name="dynamic" class="input" required />';
		formEl.insertBefore(wrapper, formEl.querySelector('button'));
		await flushAsyncValidation();

		const input = formEl.querySelector<HTMLInputElement>('input[name="dynamic"]')!;
		input.dispatchEvent(new Event('input'));
		await flushAsyncValidation();

		expect(form.getErrors()[0]).toEqual({
			field: 'dynamic',
			rule: 'required',
			message: expect.any(String),
			source: 'client',
		});
	});

	test('invalid custom selectors warn without crashing', async () => {
		buildForms(`
			<form id="f">
				<input name="email" class="input" value="bad" data-validate="email" data-error-container="[" />
				<button type="submit"></button>
			</form>
		`);
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const form = new Form(document.getElementById('f') as HTMLFormElement, {
			inputWrapperSelector: '.missing',
			scrollToFirstErroredInput: false,
			validationSchema: {
				broken: {
					selector: '[',
					rules: ['required'],
				},
			},
		});

		expect(await form.validate()).toBe(false);
		expect(warn).toHaveBeenCalledWith('[FormFather] Invalid validation selector "["');
		expect(warn).toHaveBeenCalledWith('[FormFather] Invalid error container selector "["');
	});
});
