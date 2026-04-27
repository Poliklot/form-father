import Form, { FORM_ERROR_FIELD } from '../src/index';

function buildForm(markup: string): HTMLFormElement {
	document.body.innerHTML = markup;
	return document.getElementById('f') as HTMLFormElement;
}

afterEach(() => {
	jest.restoreAllMocks();
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
		ariaDescribeErrors: true,
		errorIdPrefix: 'form-father-error',
		errorSummary: false,
		observeMutations: false,
	});
});

describe('Form a11y error contract', () => {
	test('generated field errors are linked with aria-describedby without removing existing hints', async () => {
		const formEl = buildForm(`
			<form id="f">
				<p id="name-hint">Use your public name.</p>
				<div class="input__wrapper">
					<input name="name" class="input" aria-describedby="name-hint" required />
				</div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});
		const input = formEl.querySelector<HTMLInputElement>('input[name="name"]')!;

		expect(await form.validate()).toBe(false);

		const error = formEl.querySelector<HTMLElement>('[data-form-father-error]')!;
		expect(error.id).toMatch(/^form-father-error-name-\d+$/);
		expect(error.getAttribute('role')).toBe('alert');
		expect(input.getAttribute('aria-describedby')).toBe(`name-hint ${error.id}`);

		input.value = 'Ada';
		expect(await form.validate()).toBe(true);
		expect(input.getAttribute('aria-describedby')).toBe('name-hint');
		expect(input.hasAttribute('data-form-father-describedby-id')).toBe(false);
		expect(formEl.querySelector('[data-form-father-error]')).toBeNull();
	});

	test('custom error containers keep their own describedby wiring intact', async () => {
		const formEl = buildForm(`
			<form id="f">
				<p id="email-hint">Work email only.</p>
				<label class="field">
					<input
						name="email"
						class="input"
						value="bad"
						data-validate="email"
						data-error-container="#email-error"
						aria-describedby="email-hint email-error"
					/>
				</label>
				<small id="email-error" hidden></small>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.field',
			scrollToFirstErroredInput: false,
		});
		const input = formEl.querySelector<HTMLInputElement>('input[name="email"]')!;
		const error = formEl.querySelector<HTMLElement>('#email-error')!;

		expect(await form.validate()).toBe(false);
		expect(error.textContent).toBe('Неверный формат');
		expect(error.getAttribute('role')).toBe('alert');
		expect(error.hasAttribute('hidden')).toBe(false);
		expect(input.getAttribute('aria-describedby')).toBe('email-hint email-error');

		input.value = 'ada@example.com';
		expect(await form.validate()).toBe(true);
		expect(error.textContent).toBe('');
		expect(error.hasAttribute('hidden')).toBe(true);
		expect(input.getAttribute('aria-describedby')).toBe('email-hint email-error');
	});

	test('aria-describedby wiring can be disabled per form', async () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper">
					<input name="name" class="input" required />
				</div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			ariaDescribeErrors: false,
		});

		expect(await form.validate()).toBe(false);
		expect(formEl.querySelector('[data-form-father-error]')?.id).toMatch(/^form-father-error-name-\d+$/);
		expect(formEl.querySelector<HTMLInputElement>('input')?.hasAttribute('aria-describedby')).toBe(false);
	});

	test('default error summary renders field and form errors and can focus the summary', async () => {
		const formEl = buildForm(`
			<form id="f">
				<div id="summary"></div>
				<div class="input__wrapper">
					<input name="email" class="input" required />
				</div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			errorSummary: {
				selector: '#summary',
				title: 'Fix these fields',
				focus: true,
			},
			formValidators: () => ({ field: FORM_ERROR_FIELD, message: 'Global warning' }),
		});
		const summary = formEl.querySelector<HTMLElement>('#summary')!;
		const focusSummary = jest.spyOn(summary, 'focus').mockImplementation(() => {});
		const input = formEl.querySelector<HTMLInputElement>('input[name="email"]')!;
		const scrollIntoView = jest.fn();
		Object.defineProperty(input, 'scrollIntoView', {
			value: scrollIntoView,
			configurable: true,
		});
		const focusInput = jest
			.spyOn(input, 'focus')
			.mockImplementationOnce(() => {
				throw new Error('focus options unsupported');
			})
			.mockImplementation(() => {});

		expect(await form.validate()).toBe(false);

		expect(summary.getAttribute('data-form-father-summary')).toBe('');
		expect(summary.getAttribute('role')).toBe('alert');
		expect(summary.getAttribute('tabindex')).toBe('-1');
		expect(summary.querySelector('[data-form-father-summary-title]')?.textContent).toBe('Fix these fields');
		expect(Array.from(summary.querySelectorAll('li')).map(item => item.textContent)).toEqual([
			'Пустое значение',
			'Global warning',
		]);
		expect(focusSummary).toHaveBeenCalledWith({ preventScroll: true });

		summary.querySelector<HTMLButtonElement>('[data-form-father-summary-field="email"]')?.click();
		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
		expect(focusInput.mock.calls[0]).toEqual([{ preventScroll: true }]);
		expect(focusInput.mock.calls[1]).toEqual([]);

		form.clearErrors();
		expect(summary.hasAttribute('hidden')).toBe(true);
		expect(summary.textContent).toBe('');
	});

	test('custom error summary renderers can return an element', () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="name" class="input" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			errorSummary: {
				render(errors) {
					const node = document.createElement('strong');
					node.textContent = `${errors.length} custom error`;
					return node;
				},
			},
		});

		form.showFieldError('name', 'Bad name');

		const summary = formEl.querySelector<HTMLElement>('[data-form-father-summary]')!;
		expect(summary.textContent).toBe('1 custom error');
		expect(summary.querySelector('strong')).not.toBeNull();
	});

	test('custom error summary renderers can return html strings and focus has a fallback path', () => {
		const formEl = buildForm(`
			<form id="f">
				<div id="summary"></div>
				<div class="input__wrapper"><input name="name" class="input" /></div>
				<button type="submit"></button>
			</form>
		`);
		const summary = formEl.querySelector<HTMLElement>('#summary')!;
		const focus = jest
			.spyOn(summary, 'focus')
			.mockImplementationOnce(() => {
				throw new Error('focus options unsupported');
			})
			.mockImplementation(() => {});
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			errorSummary: {
				selector: '#summary',
				focus: true,
				render: () => '<b>String summary</b>',
			},
		});

		form.showFieldError('name', 'Bad name');

		expect(summary.innerHTML).toBe('<b>String summary</b>');
		expect(focus.mock.calls[0]).toEqual([{ preventScroll: true }]);
		expect(focus.mock.calls[1]).toEqual([]);

		(form as any).renderErrorSummary([]);
		expect(summary.hasAttribute('hidden')).toBe(true);
	});

	test('invalid error summary selector warns and validation still completes', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="name" class="input" required /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			errorSummary: { selector: '[' },
		});

		expect(await form.validate()).toBe(false);
		expect(warn).toHaveBeenCalledWith('[FormFather] Invalid error summary selector "["');
	});
});
