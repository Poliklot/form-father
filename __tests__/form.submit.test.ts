import Form from '../src/index';

function buildForm(markup: string): HTMLFormElement {
	document.body.innerHTML = markup;
	return document.getElementById('f') as HTMLFormElement;
}

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
	document.body.innerHTML = '';
});

describe('Form submit buttons', () => {
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
});
