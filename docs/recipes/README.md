# Form Father Recipes

## Init several forms

```ts
import Form from 'form-father';

const forms = Form.initAll('form[data-form-father]', {
	inputWrapperSelector: '.field',
	validateOn: ['blur', 'change'],
	revalidateOn: ['input', 'change'],
});
```

## HTML-only rules

```html
<input
	name="email"
	type="email"
	data-validate="required|email"
	data-error-required="Email is required"
	data-error-email="Enter a valid email"
	data-error-container="#email-error"
/>
<small id="email-error" hidden></small>
```

## Programmatic field API

```ts
const form = new Form(document.querySelector('form')!);

await form.validateField('email');
form.showFieldError('email', 'This email is already used', 'server');
console.log(form.getErrors());
```

## State helpers

```ts
form.setValues({
	email: 'user@example.com',
	interests: ['docs', 'api'],
});

console.log(form.getValues());
form.clearErrors();
form.reset();
```

## Cross-field validation

```ts
import { dateOrder, requiredIf, sameAsField } from 'form-father';

const form = new Form(document.querySelector('form')!, {
	formValidators: [
		sameAsField('passwordConfirm', 'password', 'Passwords do not match'),
		requiredIf('email', ({ values }) => Boolean(values.subscribe), 'Email is required'),
		dateOrder('start', 'end', 'End date must be after start'),
	],
});
```

## Field rule helpers

```ts
import { createLengthValidator, createPatternValidator, registerFieldValidator, registerValidator } from 'form-father';

registerFieldValidator('starts-with-a', value => value.startsWith('A'), 'Must start with A');
registerValidator('slug', createPatternValidator(/^[a-z0-9-]+$/), 'Slug characters only');
registerValidator('short-name', createLengthValidator({ min: 2, max: 24 }), 'Use 2-24 characters');
```

## Applying backend errors

```ts
import { FORM_ERROR_FIELD } from 'form-father';

form.setErrors({
	email: 'Email is already registered',
	[FORM_ERROR_FIELD]: 'Please check the form',
});
```

## Async validation state

```css
[data-form-father-state="validating"] {
	opacity: 0.7;
}

[data-form-father-state="invalid"] {
	border-color: #b3261e;
}
```

Async validators are race-safe: if an older validation finishes after a newer one started, Form Father ignores the stale
result and keeps the latest field state.

## Zod-like schema adapter

```ts
import { registerSchemaValidator } from 'form-father';

registerSchemaValidator('email-domain', z.string().email().endsWith('@company.com'), 'Use a company email');
```

The adapter only expects a `safeParse(value)` or `parse(value)` method, so it can be used with Zod-like libraries without
adding runtime dependencies to Form Father.

## Server response errors

```json
{
	"success": false,
	"error": true,
	"error-msg": "Please check the form",
	"errors": [{ "name": "email", "error-msg": "Email is already registered" }]
}
```

Field errors are shown through the same rendering path as client-side validation errors.

## Accessible error summary

```html
<form data-form-father novalidate>
	<div data-form-father-summary hidden></div>
	<label>
		Email
		<input class="input" name="email" data-validate="required|email" />
	</label>
	<button type="submit">Submit</button>
</form>
```

```ts
const form = new Form(document.querySelector('form')!, {
	inputWrapperSelector: 'label',
	errorSummary: {
		title: 'Please check the form',
		focus: true,
	},
});
```

Inline errors are linked to fields with `aria-describedby` by default. Use `ariaDescribeErrors: false` if your design
system owns that relationship itself.
