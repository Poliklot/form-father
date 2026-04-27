import Form, {
	FORM_ERROR_FIELD,
	createFormValidator,
	dateOrder,
	requiredIf,
	sameAsField,
	type FormValidatorContext,
} from '../src/index';

function buildForm(markup: string): HTMLFormElement {
	document.body.innerHTML = markup;
	return document.getElementById('f') as HTMLFormElement;
}

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
	document.body.innerHTML = '';
	document.documentElement.removeAttribute('data-now-scrolling');
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

describe('Form cross-field validation and setErrors()', () => {
	test('formValidators can attach cross-field errors to a concrete field', async () => {
		const seenContext = jest.fn();
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="password" class="input" value="secret-one" /></div>
				<div class="input__wrapper"><input name="confirm" class="input" value="secret-two" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			formValidators: ({ values, form: instance, formElement, errors }: FormValidatorContext) => {
				seenContext({ instance, formElement, errors });
				return values.password === values.confirm
					? true
					: { field: 'confirm', rule: 'same-as-password', message: 'Passwords do not match' };
			},
		});

		expect(await form.validate()).toBe(false);
		expect(seenContext).toHaveBeenCalledWith({ instance: form, formElement: formEl, errors: [] });
		expect(form.getErrors()).toEqual([
			{ field: 'confirm', rule: 'same-as-password', message: 'Passwords do not match', source: 'client' },
		]);
		expect(formEl.querySelector<HTMLInputElement>('input[name="confirm"]')?.getAttribute('aria-invalid')).toBe('true');

		form.setValues({ confirm: 'secret-one' });
		expect(await form.validate()).toBe(true);
		expect(form.getErrors()).toEqual([]);
	});

	test('formValidators can return form-level, false and async issue arrays', async () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="start" class="input" value="2026-04-30" /></div>
				<div class="input__wrapper"><input name="end" class="input" value="2026-04-01" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			formValidators: [
				() => 'Form-level warning',
				() => false,
				async ({ values }) =>
					values.start > values.end
						? [{ field: 'end', rule: 'date-range', message: 'End date must be after start' }]
						: [],
			],
		});

		expect(await form.validate()).toBe(false);
		expect(form.getErrors()).toEqual([
			{ field: FORM_ERROR_FIELD, rule: 'client', message: 'Form-level warning', source: 'client' },
			{ field: FORM_ERROR_FIELD, rule: 'client', message: 'Некорректные данные формы', source: 'client' },
			{ field: 'end', rule: 'date-range', message: 'End date must be after start', source: 'client' },
		]);
		expect(formEl.querySelector('.error-block-under-input__main-text')?.textContent).toBe('Некорректные данные формы');
	});

	test('setErrors accepts maps, ErrorResponse arrays, form-level issues and missing fields', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="email" class="input" /></div>
				<div class="input__wrapper"><input name="name" class="input" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		expect(form.setErrors({ email: 'Email is busy', [FORM_ERROR_FIELD]: 'Server rejected form' })).toBe(form);
		form.setErrors(0 as any);
		form.setErrors([
			{ name: 'name', 'error-msg': 'Name is invalid' },
			{ name: 'missing', 'error-msg': 'Missing is invalid' },
			{ field: 'email', rule: 'mx', message: 'Email domain is not allowed', source: 'server' },
			'Global string error',
		]);

		expect(form.getErrors()).toEqual([
			{ field: FORM_ERROR_FIELD, rule: 'server', message: 'Server rejected form', source: 'server' },
			{ field: 'name', rule: 'server', message: 'Name is invalid', source: 'server' },
			{ field: 'missing', rule: 'server', message: 'Missing is invalid', source: 'server' },
			{ field: 'email', rule: 'mx', message: 'Email domain is not allowed', source: 'server' },
			{ field: FORM_ERROR_FIELD, rule: 'server', message: 'Global string error', source: 'server' },
		]);
		expect(formEl.querySelector<HTMLInputElement>('input[name="email"]')?.getAttribute('aria-invalid')).toBe('true');
		expect(formEl.querySelector('.error-block-under-input__main-text')?.textContent).toBe('Global string error');
		expect(warn).toHaveBeenCalledWith('Не найдено поле с именем: missing, для вывода ошибки: Missing is invalid');
	});

	test('conditional formValidators can read checkbox state from getValues()', async () => {
		const formEl = buildForm(`
			<form id="f">
				<label><input name="subscribe" class="input" type="checkbox" value="yes" checked /></label>
				<div class="input__wrapper"><input name="email" class="input" value="" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			formValidators: ({ values }) =>
				values.subscribe && !values.email
					? { field: 'email', rule: 'conditional-required', message: 'Email required for subscription' }
					: undefined,
		});

		expect(await form.validate()).toBe(false);
		expect(form.getErrors()).toEqual([
			{
				field: 'email',
				rule: 'conditional-required',
				message: 'Email required for subscription',
				source: 'client',
			},
		]);

		form.setValues({ subscribe: false });
		expect(await form.validate()).toBe(true);
	});

	test('v0.5 form validator helpers cover common cross-field recipes', async () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="password" class="input" value="one" /></div>
				<div class="input__wrapper"><input name="confirm" class="input" value="two" /></div>
				<label><input name="subscribe" class="input" type="checkbox" value="yes" checked /></label>
				<div class="input__wrapper"><input name="email" class="input" value="" /></div>
				<div class="input__wrapper"><input name="start" class="input" value="2026-04-30" /></div>
				<div class="input__wrapper"><input name="end" class="input" value="2026-04-01" /></div>
				<div class="input__wrapper"><input name="custom" class="input" value="no" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			formValidators: [
				createFormValidator(({ values }) => values.custom === 'yes', 'Plain form validator failure'),
				sameAsField('confirm', 'password', 'Passwords differ'),
				requiredIf('email', ({ values }) => Boolean(values.subscribe), 'Email required'),
				dateOrder('start', 'end', 'End after start'),
				createFormValidator(
					({ values }) => values.custom === 'yes',
					({ values }) => ({
						field: 'custom',
						rule: 'custom-yes',
						message: `Expected yes, got ${values.custom}`,
					}),
				),
			],
		});

		expect(await form.validate()).toBe(false);
		expect(form.getErrors()).toEqual([
			{ field: FORM_ERROR_FIELD, rule: 'client', message: 'Plain form validator failure', source: 'client' },
			{ field: 'confirm', rule: 'same-as-field', message: 'Passwords differ', source: 'client' },
			{ field: 'email', rule: 'conditional-required', message: 'Email required', source: 'client' },
			{ field: 'end', rule: 'date-order', message: 'End after start', source: 'client' },
			{ field: 'custom', rule: 'custom-yes', message: 'Expected yes, got no', source: 'client' },
		]);

		form.setValues({
			confirm: 'one',
			subscribe: false,
			end: '2026-05-01',
			custom: 'yes',
		});

		expect(await form.validate()).toBe(true);
	});
});
