import Form from '../src/index';
import { registerValidator } from '../src/validators';

const originalFetch = global.fetch;
const originalMatchMedia = window.matchMedia;
const originalAnimate = Element.prototype.animate;
const originalGetAnimations = Element.prototype.getAnimations;

function buildForm(markup: string): HTMLFormElement {
	document.body.innerHTML = markup;
	return document.getElementById('f') as HTMLFormElement;
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

function mockAnimationApi() {
	const finishListeners: Array<() => void> = [];
	const animate = jest.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => ({
		addEventListener: jest.fn((event: string, cb: () => void) => {
			if (event === 'finish') finishListeners.push(cb);
		}),
	}));
	const cancel = jest.fn();

	Element.prototype.animate = animate as any;
	Element.prototype.getAnimations = jest.fn(() => [{ cancel }]) as any;

	return { animate, cancel, finishListeners };
}

function restoreAnimationApi() {
	if (originalAnimate) {
		Element.prototype.animate = originalAnimate;
	} else {
		delete (Element.prototype as any).animate;
	}

	if (originalGetAnimations) {
		Element.prototype.getAnimations = originalGetAnimations;
	} else {
		delete (Element.prototype as any).getAnimations;
	}
}

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
	global.fetch = originalFetch;
	window.matchMedia = originalMatchMedia;
	restoreAnimationApi();
	document.body.innerHTML = '';
	document.documentElement.removeAttribute('data-now-scrolling');
	Form.setDefaultParams({
		showLoaderButton: true,
		scrollToFirstErroredInput: true,
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

describe('Form lifecycle and edge behavior', () => {
	test('constructor validates empty and incorrect arguments', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

		new Form(null as any);
		expect(warn).toHaveBeenCalledWith('Empty $el');

		document.body.innerHTML = '<div id="not-form"><button type="submit"></button></div>';
		new Form(document.getElementById('not-form') as HTMLElement);
		expect(warn).toHaveBeenCalledWith('$el не является тегом form');

		document.body.innerHTML = '<form id="f"></form>';
		new Form(document.getElementById('f') as HTMLElement);
		expect(warn).toHaveBeenCalledWith('В форме нет кнопки с типом submit');
	});

	test('setDefaultParams and defaultValidationSchema affect new forms', async () => {
		Form.setDefaultParams({
			scrollToFirstErroredInput: false,
			inputWrapperSelector: '.input__wrapper',
		});

		const previousSchema = Form.defaultValidationSchema;
		Form.defaultValidationSchema = {
			custom: {
				selector: '[data-validate="custom"]',
				rules: ['required'],
				messages: { required: 'Custom required' },
			},
		};

		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper">
					<input name="custom" class="input" data-validate="custom" />
				</div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl);
		const showError = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		expect(await (form as any).validate()).toBe(false);
		expect(showError).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Custom required');

		Form.defaultValidationSchema = previousSchema;
	});

	test('click and submit handlers run validation callbacks and submit only valid forms', async () => {
		const fetchMock = mockFetch(jsonResponse({ success: true }));
		const onBeforeValidate = jest.fn();
		const onAfterValidate = jest.fn();
		const onSubmit = jest.fn();
		const onResponseSuccess = jest.fn();
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
			showLoaderButton: false,
			onBeforeValidate,
			onAfterValidate,
			onSubmit,
			onResponseSuccess,
		});

		await (form as any)._onSubmitClickHandler({ preventDefault: jest.fn() } as any);

		expect(onBeforeValidate).toHaveBeenCalledTimes(1);
		expect(onAfterValidate).toHaveBeenCalledWith(true, form);
		expect(onSubmit).toHaveBeenCalledWith(form);
		expect(onResponseSuccess).toHaveBeenCalledWith({ success: true }, form);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await (form as any)._onSubmitHandler({ preventDefault: jest.fn() } as any);
		await Promise.resolve();
		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('click handler does not submit invalid forms', async () => {
		const fetchMock = mockFetch(jsonResponse({ success: true }));
		const onAfterValidate = jest.fn();
		const formEl = buildForm(`
			<form id="f" action="/submit" method="post">
				<div class="input__wrapper">
					<input name="email" type="email" class="input" required />
				</div>
				<button type="submit">Submit</button>
			</form>
		`);
		const form = new Form(formEl, {
			inputSelector: '.input',
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
			onAfterValidate,
		});
		jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		await (form as any)._onSubmitClickHandler({ preventDefault: jest.fn() } as any);

		expect(onAfterValidate).toHaveBeenCalledWith(false, form);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test('showError delegates to wrapper.showError and warns when wrapper is missing', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper">
					<input name="name" class="input" />
				</div>
				<input name="orphan" class="input" />
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
		});
		const wrapper = formEl.querySelector('.input__wrapper') as HTMLElement & { showError?: jest.Mock };
		wrapper.showError = jest.fn();

		(form as any).showError(formEl.querySelector<HTMLInputElement>('input[name="name"]')!, 'Name error');
		expect(wrapper.showError).toHaveBeenCalledWith('Name error');

		(form as any).showError(formEl.querySelector<HTMLInputElement>('input[name="orphan"]')!, 'Orphan error');
		expect(warn).toHaveBeenCalledWith('Не найдена обёртка для поля с именем: orphan');
	});

	test('validation handles object results, side effects, stopOthers, fallback selectors and scrolling', async () => {
		jest.useFakeTimers();
		const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
		const effect = jest.fn();
		const stopped = jest.fn();
		registerValidator(
			'object-pass-stop',
			() => ({ valid: true, effect, stopOthers: true }),
			'Should not fail',
			{ override: true },
		);
		registerValidator(
			'object-fail',
			() => ({ valid: false, message: 'Object message' }),
			'Default object fail',
			{ override: true },
		);
		registerValidator(
			'should-not-run',
			() => {
				stopped();
				return false;
			},
			'Stopped',
			{ override: true },
		);

		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper">
					<input name="first" class="input" value="ok" data-custom-validate="object-pass-stop,should-not-run" />
				</div>
				<div class="input__wrapper">
					<input name="second" class="input" value="bad" data-validate="fallback" />
				</div>
				<div class="input__wrapper">
					<input name="ignored" class="input" value="" required data-no-validate />
				</div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			validationSchema: {
				fallback: {
					rules: ['object-fail'],
				},
			},
		});
		const showError = jest.spyOn(form as any, 'showError').mockImplementation(() => {});

		expect(await (form as any).validate()).toBe(false);
		expect(effect).toHaveBeenCalledWith(
			expect.objectContaining({
				value: 'ok',
				$input: expect.any(HTMLInputElement),
				$form: formEl,
			}),
		);
		expect(stopped).not.toHaveBeenCalled();
		expect(showError).toHaveBeenCalledWith(expect.any(HTMLInputElement), 'Object message');
		expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));

		jest.advanceTimersByTime(800);
		expect(document.documentElement.hasAttribute('data-now-scrolling')).toBe(false);
	});

	test('disableSubmit, enableSubmit and clearInputs update controls', () => {
		const formEl = buildForm(`
			<form id="f">
				<div class="filled">
					<input name="name" class="input" value="Ivan" />
				</div>
				<label>
					<input name="agree" type="checkbox" class="input" checked />
				</label>
				<label>
					<input name="choice" type="radio" class="input" checked />
				</label>
				<textarea name="message" class="input">Hello</textarea>
				<button type="submit">Submit</button>
			</form>
		`);
		const form = new Form(formEl);
		const inputEvent = jest.fn();
		formEl.querySelector<HTMLInputElement>('input[name="name"]')!.addEventListener('input', inputEvent);

		(form as any).disableSubmit();
		expect(formEl.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true);

		(form as any).enableSubmit();
		expect(formEl.querySelector<HTMLButtonElement>('button')!.disabled).toBe(false);

		form.clearInputs();

		expect(formEl.querySelector<HTMLInputElement>('input[name="name"]')!.value).toBe('');
		expect(formEl.querySelector<HTMLInputElement>('input[name="agree"]')!.checked).toBe(false);
		expect(formEl.querySelector<HTMLInputElement>('input[name="choice"]')!.checked).toBe(false);
		expect(formEl.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('');
		expect(formEl.querySelector('.filled')).toBeNull();
		expect(inputEvent).toHaveBeenCalled();
	});

	test('showErrorForm, hideErrorForm and _ringIcon cover animation and reduced-motion paths', () => {
		jest.useFakeTimers();
		const { animate, cancel, finishListeners } = mockAnimationApi();
		window.matchMedia = jest.fn().mockReturnValue({ matches: false } as any);

		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="name" class="input" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, { inputWrapperSelector: '.input__wrapper' });

		(form as any).showErrorForm('Form error');
		const wrapper = formEl.querySelector<HTMLElement>('.error-block-under-input__wrapper')!;
		expect(wrapper.querySelector('.error-block-under-input__main-text')?.textContent).toBe('Form error');
		expect(animate).toHaveBeenCalled();
		expect(cancel).toHaveBeenCalled();

		finishListeners.forEach(cb => cb());
		expect(wrapper.style.opacity).toBe('1');

		(form as any).showErrorForm('Updated error');
		expect(wrapper.querySelector('.error-block-under-input__main-text')?.textContent).toBe('Updated error');

		(form as any).hideErrorForm();
		finishListeners.forEach(cb => cb());
		expect(formEl.querySelector('.error-block-under-input__wrapper')).toBeNull();

		window.matchMedia = jest.fn().mockReturnValue({ matches: true } as any);
		(form as any).showErrorForm('Reduced motion error');
		expect(formEl.querySelector<HTMLElement>('.error-block-under-input__wrapper')!.style.opacity).toBe('1');
	});

	test('showErrorForm rings icon when the error block is already opened at target height', () => {
		const ring = jest.spyOn(Form.prototype as any, '_ringIcon').mockImplementation(() => {});
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="name" class="input" /></div>
				<div class="error-block-under-input__wrapper" style="height:0px;opacity:1;">
					<div class="error-block-under-input error-block-under-input--warning">
						<span class="error-block-under-input__main-text"></span>
						<span class="error-block-under-input__secondary-text"></span>
						<span class="error-block-under-input__icon--animated"></span>
					</div>
				</div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, { inputWrapperSelector: '.input__wrapper' });

		(form as any).showErrorForm('Already open');

		expect(ring).toHaveBeenCalled();
		expect(formEl.querySelector('.error-block-under-input__main-text')?.textContent).toBe('Already open');
	});

	test('showErrorForm and hideErrorForm work without input wrappers', () => {
		const formEl = buildForm(`
			<form id="f">
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, { inputWrapperSelector: '.missing' });

		(form as any).showErrorForm('Global error');
		expect(formEl.querySelector('.error-block-under-input__main-text')?.textContent).toBe('Global error');

		(form as any).hideErrorForm();
		expect(formEl.querySelector('.error-block-under-input__wrapper')).toBeNull();
	});

	test('destroy removes listeners, loaders, errors and state', () => {
		jest.useFakeTimers();
		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper input__wrapper--error">
					<input name="name" class="input" aria-invalid="true" />
					<div data-form-father-error>Name error</div>
				</div>
				<button type="submit">Submit</button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
		});
		const submit = jest.spyOn(form as any, 'submit').mockResolvedValue(undefined);

		(form as any).showLoader();
		(form as any).showErrorForm('Form error');
		document.documentElement.setAttribute('data-now-scrolling', '');
		(form as any).waitResponse = true;

		form.destroy();

		formEl.querySelector<HTMLButtonElement>('button')!.type = 'button';
		formEl.querySelector<HTMLButtonElement>('button')!.dispatchEvent(
			new MouseEvent('click', { bubbles: true, cancelable: true }),
		);
		formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

		expect(submit).not.toHaveBeenCalled();
		expect(formEl.querySelector('.button__loader')).toBeNull();
		expect(formEl.querySelector('.error-block-under-input__wrapper')).toBeNull();
		expect(formEl.querySelector('[data-form-father-error]')).toBeNull();
		expect(formEl.querySelector('input')!.hasAttribute('aria-invalid')).toBe(false);
		expect(document.documentElement.hasAttribute('data-now-scrolling')).toBe(false);
		expect((form as any).inputs).toBeNull();
		expect((form as any).$submits).toEqual([]);
		expect((form as any).waitResponse).toBe(false);
	});
});
