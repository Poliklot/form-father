import Form, {
	createLengthValidator,
	createFieldValidator,
	createPatternValidator,
	createSchemaValidator,
	registerFieldValidator,
	registerSchemaValidator,
	registerValidator,
} from '../src/index';

function buildForm(markup: string): HTMLFormElement {
	document.body.innerHTML = markup;
	return document.getElementById('f') as HTMLFormElement;
}

afterEach(() => {
	jest.restoreAllMocks();
	document.body.innerHTML = '';
});

describe('schema and field validator adapters', () => {
	test('createSchemaValidator supports safeParse success and failure messages', async () => {
		const schema = {
			safeParse: jest.fn((value: unknown) =>
				value === 'ok'
					? { success: true, data: value }
					: { success: false, error: { issues: [{ message: 'Schema issue' }] } },
			),
		};
		const validator = createSchemaValidator(schema);

		expect(await validator('ok', document.createElement('input'), document.body)).toBe(true);
		expect(await validator('bad', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'Schema issue',
		});

		const errorMessageSchema = {
			safeParse: () => ({ success: false, error: new Error('Error message fallback') }),
		};
		const errorMessageValidator = createSchemaValidator(errorMessageSchema);
		expect(await errorMessageValidator('bad', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'Error message fallback',
		});

		const legacyErrorSchema = {
			safeParse: () => ({ success: false, error: { errors: [{ message: 'Legacy issue message' }] } }),
		};
		expect(await createSchemaValidator(legacyErrorSchema)('bad', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'Legacy issue message',
		});
	});

	test('createSchemaValidator supports parse(), mapper and message factories', async () => {
		const schema = {
			parse: jest.fn((value: unknown) => {
				if (value !== 42) throw Object.assign(new Error('Raw parser message'), { issues: [{ message: 'Issue 42' }] });
				return value;
			}),
		};
		const validator = createSchemaValidator(schema, {
			mapValue: value => Number(value),
			message: error => `Mapped: ${(error as Error).message}`,
		});

		expect(await validator('42', document.createElement('input'), document.body)).toBe(true);
		expect(await validator('7', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'Mapped: Raw parser message',
		});
	});

	test('createSchemaValidator supports function schemas and unknown schema fallback', async () => {
		const objectResult = createSchemaValidator(() => ({ valid: false, message: 'Object result' }));
		const voidResult = createSchemaValidator(() => undefined);
		const falseResult = createSchemaValidator(() => false, { message: 'False result' });
		const unknown = createSchemaValidator({} as any, { message: 'Unknown schema' });

		expect(await objectResult('x', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'Object result',
		});
		expect(await voidResult('x', document.createElement('input'), document.body)).toBe(true);
		expect(await falseResult('x', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'False result',
		});
		expect(await unknown('x', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'Unknown schema',
		});
	});

	test('registerSchemaValidator and createFieldValidator plug into Form validation', async () => {
		registerSchemaValidator(
			'upper',
			{
				safeParse: (value: unknown) =>
					value === 'ABC' ? { success: true } : { success: false, issues: [{ message: 'Uppercase only' }] },
			},
			'Default uppercase',
			{ override: true },
		);
		registerValidator('has-prefix', createFieldValidator((value, _input, _form, prefix) => value.startsWith(prefix)), 'Bad prefix', {
			override: true,
		});
		registerSchemaValidator('lower', (value: unknown) => value === 'abc', 'Lowercase only', { override: true });

		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="code" class="input" value="abc" data-validate="upper" /></div>
				<div class="input__wrapper"><input name="prefixed" class="input" value="ID-7" data-validate="has-prefix:ID-" /></div>
				<div class="input__wrapper"><input name="lower" class="input" value="ABC" data-validate="lower" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		expect(await form.validate()).toBe(false);
		expect(form.getErrors()).toEqual([
			{ field: 'code', rule: 'upper', message: 'Uppercase only', source: 'client' },
			{ field: 'lower', rule: 'lower', message: 'Lowercase only', source: 'client' },
		]);

		formEl.querySelector<HTMLInputElement>('input[name="code"]')!.value = 'ABC';
		formEl.querySelector<HTMLInputElement>('input[name="lower"]')!.value = 'abc';
		expect(await form.validate()).toBe(true);
	});

	test('registerFieldValidator, createPatternValidator and createLengthValidator reduce field-rule boilerplate', async () => {
		registerFieldValidator('starts-with-a', value => value.startsWith('A'), 'Must start with A', { override: true });
		registerValidator('slug', createPatternValidator(/^[a-z0-9-]+$/, 'Slug only'), 'Slug only', { override: true });
		registerValidator('nickname-length', createLengthValidator({ min: 3, max: 5 }, '3-5 chars'), '3-5 chars', {
			override: true,
		});
		registerValidator(
			'optional-short',
			createLengthValidator({ max: 3, emptyIsValid: true }, 'Max 3 chars'),
			'Max 3 chars',
			{ override: true },
		);

		const formEl = buildForm(`
			<form id="f">
				<div class="input__wrapper"><input name="name" class="input" value="Bob" data-validate="starts-with-a" /></div>
				<div class="input__wrapper"><input name="slug" class="input" value="Bad slug" data-validate="slug" /></div>
				<div class="input__wrapper"><input name="nickname" class="input" value="Bo" data-validate="nickname-length" /></div>
				<div class="input__wrapper"><input name="optional" class="input" value="" data-validate="optional-short" /></div>
				<button type="submit"></button>
			</form>
		`);
		const form = new Form(formEl, {
			inputWrapperSelector: '.input__wrapper',
			scrollToFirstErroredInput: false,
		});

		expect(await form.validate()).toBe(false);
		expect(form.getErrors()).toEqual([
			{ field: 'name', rule: 'starts-with-a', message: 'Must start with A', source: 'client' },
			{ field: 'slug', rule: 'slug', message: 'Slug only', source: 'client' },
			{ field: 'nickname', rule: 'nickname-length', message: '3-5 chars', source: 'client' },
		]);

		form.setValues({
			name: 'Alice',
			slug: 'good-slug',
			nickname: 'Bobby',
			optional: '',
		});
		expect(await form.validate()).toBe(true);

		const noTrim = createLengthValidator({ min: 3, trim: false }, 'Needs spaces too');
		expect(await noTrim('  a', document.createElement('input'), document.body)).toBe(true);
		const tooLong = createLengthValidator({ max: 3 }, 'Too long');
		expect(await tooLong('abcd', document.createElement('input'), document.body)).toEqual({
			valid: false,
			message: 'Too long',
		});
	});
});
