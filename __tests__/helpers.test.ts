import { isUrlValid } from '../src/helpers';

describe('helpers.isUrlValid()', () => {
	test.each([
		['https://example.com', true],
		['example.com', true],
		['www.apple.com', true],
		['мойсайт.рф', true],
		['1.1.1.1', true],
		['localhost', true],
		['https://[::1]', true],
		['example', false],
		['"мойсайт.рф', false],
		['exa_mple.com', false],
		['', false],
	])('%s -> %s', (value, expected) => {
		expect(isUrlValid(value)).toBe(expected);
	});
});
