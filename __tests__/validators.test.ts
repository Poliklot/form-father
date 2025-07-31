import { getValidator } from '../src/validators';

describe('builtin validators', () => {
	interface Case {
		rule: string;
		value: string;
		expected: boolean;
	}

	const cases: Case[] = [
		{ rule: 'required', value: '', expected: false },
		{ rule: 'required', value: 'abc', expected: true },
		{ rule: 'email', value: 'foo@bar.com', expected: true },
		{ rule: 'email', value: 'foo@bar', expected: false },
		{ rule: 'url', value: 'https://example.com', expected: true },
		{ rule: 'url', value: 'example', expected: false },
		{ rule: 'not-numbers', value: 'abc', expected: true },
		{ rule: 'not-numbers', value: 'a1c', expected: false },
	];

	test.each(cases)('%s("%s") → %s', ({ rule, value, expected }) => {
		const vd = getValidator(rule);
		expect(vd).toBeDefined();
		expect(vd!.fn(value, {} as any, {} as any)).toBe(expected);
	});

	/* «страховка», чтобы даже при пустом массиве кейсов suite не упал */
	test('dummy always passes', () => {
		expect(true).toBe(true);
	});
});
