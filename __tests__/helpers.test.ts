import {
	blockScrollBody,
	closest,
	isEmailValid,
	isPhoneValid,
	isUrlValid,
	parseCommonResponseProperties,
	serializeFormToJSON,
	serializeToFormData,
	unblockScrollBody,
} from '../src/helpers';
import { isUrlValid as exportedIsUrlValid, serializeFormToJSON as exportedSerializeFormToJSON } from '../src/index';

describe('helpers.isUrlValid()', () => {
	test.each([
		['https://example.com', true],
		['example.com', true],
		['www.apple.com', true],
		['//example.com/path', true],
		['мойсайт.рф', true],
		['1.1.1.1', true],
		['localhost', true],
		['https://[::1]', true],
		['example', false],
		['"мойсайт.рф', false],
		['exa_mple.com', false],
		['http://[', false],
		['', false],
	])('%s -> %s', (value, expected) => {
		expect(isUrlValid(value)).toBe(expected);
	});

	test('helpers are exported from the package entrypoint', () => {
		document.body.innerHTML = `
			<form id="f">
				<input name="email" value="test@example.com" />
			</form>
		`;

		expect(exportedIsUrlValid('example.com')).toBe(true);
		expect(exportedSerializeFormToJSON(document.getElementById('f') as HTMLFormElement)).toEqual({
			email: 'test@example.com',
		});
	});

	test('serializeToFormData skips disabled, data-no-serialize and button controls', () => {
		document.body.innerHTML = `
			<form id="f">
				<input name="enabled" value="yes" />
				<input name="disabled" value="no" disabled />
				<input name="hiddenLocal" value="no" data-no-serialize />
				<fieldset name="group"></fieldset>
				<button name="buttonValue" value="no">Submit</button>
			</form>
		`;

		const data = serializeToFormData(document.getElementById('f') as HTMLFormElement);

		expect(Array.from(data.entries())).toEqual([['enabled', 'yes']]);
	});
});

describe('helpers common behavior', () => {
	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
		document.body.innerHTML = '';
		document.body.className = '';
		document.body.style.cssText = '';
	});

	test('closest walks ancestors and handles null/missing matches', () => {
		document.body.innerHTML = `
			<section class="root">
				<div class="parent">
					<span id="child"></span>
				</div>
			</section>
		`;

		const child = document.getElementById('child')!;
		expect(closest(child, '.parent')).toBe(document.querySelector('.parent'));
		expect(closest(child, '.missing')).toBeNull();
		expect(closest(null, '.parent')).toBeNull();
	});

	test('blockScrollBody and unblockScrollBody preserve scroll position', () => {
		Object.defineProperty(window, 'pageYOffset', { configurable: true, value: 123 });
		const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

		blockScrollBody();
		expect((window as any).lastBlockScrollPosition).toBe(123);
		expect(document.body.style.top).toBe('-123px');
		expect(document.body.classList.contains('body--block-scroll')).toBe(true);

		unblockScrollBody();
		expect(document.body.style.top).toBe('');
		expect(document.body.classList.contains('body--block-scroll')).toBe(false);
		expect(scrollTo).toHaveBeenCalledWith(0, 123);
	});

	test.each([
		['test@example.com', true],
		['bad@', false],
	])('isEmailValid(%s) -> %s', (value, expected) => {
		expect(isEmailValid(value)).toBe(expected);
	});

	test.each([
		['+7 (999) 123-45-67', true],
		['8 999 123 45 67', true],
		['12345', false],
		['+7999123456', false],
	])('isPhoneValid(%s) -> %s', (value, expected) => {
		expect(isPhoneValid(value)).toBe(expected);
	});

	test('serializeToFormData covers common form controls and normalization', () => {
		document.body.innerHTML = `
			<form id="f">
				<input name="name" value="Ivan" />
				<input name="empty" value="" />
				<input name="phone" type="tel" value="8 (999) 111-22-33" />
				<input name="birthday" type="date" value="2026-04-25" data-date-format="dd.mm.yyyy" />
				<input name="plainDate" type="date" value="2026-04-25" />
				<input name="agree" type="checkbox" value="yes" checked />
				<input name="skipAgree" type="checkbox" value="no" />
				<input name="gender" type="radio" value="m" />
				<input name="gender" type="radio" value="f" checked />
				<select name="city">
					<option value="">Choose</option>
					<option value="moscow" selected>Moscow</option>
				</select>
				<select name="colors" multiple>
					<option value="red" selected>Red</option>
					<option value="green">Green</option>
					<option value="blue" selected>Blue</option>
				</select>
				<textarea name="message">Hello</textarea>
			</form>
		`;

		const data = serializeToFormData(document.getElementById('f') as HTMLFormElement);

		expect(Array.from(data.entries())).toEqual([
			['name', 'Ivan'],
			['phone', '+79991112233'],
			['birthday', '25.04.2026'],
			['plainDate', '2026-04-25'],
			['agree', 'yes'],
			['gender', 'f'],
			['city', 'moscow'],
			['colors[0]', 'red'],
			['colors[1]', 'blue'],
			['message', 'Hello'],
		]);
	});

	test('serializeToFormData works with non-form containers', () => {
		document.body.innerHTML = `
			<div id="container">
				<input name="name" value="Ivan" />
				<textarea name="message">Hello</textarea>
			</div>
		`;

		const data = serializeToFormData(document.getElementById('container')!);

		expect(Array.from(data.entries())).toEqual([
			['name', 'Ivan'],
			['message', 'Hello'],
		]);
	});

	test('serializeToFormData appends single and multiple files', () => {
		document.body.innerHTML = `
			<form id="f">
				<input name="avatar" type="file" />
				<input name="docs" type="file" multiple />
			</form>
		`;
		const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' });
		const doc1 = new File(['one'], 'one.txt', { type: 'text/plain' });
		const doc2 = new File(['two'], 'two.txt', { type: 'text/plain' });
		const avatarInput = document.querySelector<HTMLInputElement>('input[name="avatar"]')!;
		const docsInput = document.querySelector<HTMLInputElement>('input[name="docs"]')!;
		Object.defineProperty(avatarInput, 'files', { configurable: true, value: [avatar] });
		Object.defineProperty(docsInput, 'files', { configurable: true, value: [doc1, doc2] });

		const data = serializeToFormData(document.getElementById('f') as HTMLFormElement);

		expect(data.get('avatar')).toBe(avatar);
		expect(data.get('docs[0]')).toBe(doc1);
		expect(data.get('docs[1]')).toBe(doc2);
	});

	test('serializeFormToJSON groups repeated keys', () => {
		document.body.innerHTML = `
			<form id="f">
				<input name="tag" value="one" />
				<input name="tag" value="two" />
				<input name="title" value="Post" />
			</form>
		`;

		expect(serializeFormToJSON(document.getElementById('f') as HTMLFormElement)).toEqual({
			tag: ['one', 'two'],
			title: 'Post',
		});
	});

	test('parseCommonResponseProperties shows toasts and deprecated error-toast', () => {
		const showToast = jest.fn();
		(window as any).showToast = showToast;

		parseCommonResponseProperties({ toast: { type: 'success' } });
		parseCommonResponseProperties({ toast: [{ type: 'info' }, { type: 'error' }] });
		parseCommonResponseProperties({ 'error-toast': 'Old error' });

		expect(showToast).toHaveBeenNthCalledWith(1, { type: 'success' });
		expect(showToast).toHaveBeenNthCalledWith(2, { type: 'info' });
		expect(showToast).toHaveBeenNthCalledWith(3, { type: 'error' });
		expect(showToast).toHaveBeenNthCalledWith(4, 'Old error');
	});

	test('parseCommonResponseProperties handles redirect immediately and with delay', () => {
		jest.useFakeTimers();

		parseCommonResponseProperties({ 'redirect-url': '#now' });
		expect(window.location.hash).toBe('#now');

		parseCommonResponseProperties({ 'redirect-url': '#later', 'redirect-url-delay': 250 });
		expect(window.location.hash).toBe('#now');

		jest.advanceTimersByTime(250);
		expect(window.location.hash).toBe('#later');
	});

	test('parseCommonResponseProperties handles reload immediately and with delay', () => {
		jest.useFakeTimers();
		jest.spyOn(console, 'error').mockImplementation(() => {});

		expect(() => parseCommonResponseProperties({ reload: true })).not.toThrow();

		parseCommonResponseProperties({ reload: true, 'reload-delay': 250 });
		expect(() => jest.advanceTimersByTime(250)).not.toThrow();
	});
});
