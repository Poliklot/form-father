# Form Father

[![npm version](https://img.shields.io/npm/v/form-father)](https://www.npmjs.com/package/form-father)
[![npm downloads](https://img.shields.io/npm/dm/form-father)](https://www.npmjs.com/package/form-father)

[🇷🇺 Документация на русском](https://github.com/Poliklot/form-father/blob/master/README.md)

**Form Father** is a library for handling forms in pure JavaScript, providing convenient validation and form submission
with TypeScript support.

## Installation

Install the library via npm:

```bash
npm install form-father
```

## Usage

```javascript
import Form, { isUrlValid, serializeToFormData } from 'form-father';

Form.setDefaultParams({
  showLoaderButton: false,
  scrollToFirstErroredInput: false,
  logging: true,
});

const formElement = document.querySelector('#myForm');
const options = {
	onSubmit: formInstance => {
		// Actions on form submission
	},
	onResponse: (responseBody, formInstance) => {
		// Actions on receiving server response
	},
	// Other options...
};

const form = new Form(formElement, options);
const simpleForm = new Form(document.querySelector('#simpleForm')); // options are optional

const forms = Form.initAll('form[data-form-father]', {
	inputWrapperSelector: '.field',
	validateOn: ['blur', 'change'],
	revalidateOn: ['input', 'change'],
});
```

```ts
import Form, {
	FORM_ERROR_FIELD,
	type FormOptions,
	type ValidationSchema,
	type ResponseBody,
	type ValidationError,
	type SubmitResult,
	type FormResetOptions,
	type FormValidator,
	type ValidationIssue,
	type FormValidatorPredicate,
} from 'form-father';
```

## Options

- **onSubmit**: Callback function executed on form submission.
- **onBeforeSubmit**: Runs before sending an already valid form; returning `false` cancels the request.
- **onSubmitError**: Runs when form submission throws.
- **onResponse**: Callback function executed when a server response is received.
- **onResponseSuccess**: Callback function executed for a successful HTTP response with `success: true`.
- **onResponseUnsuccess**: Callback function executed for unsuccessful HTTP responses, `success !== true`, or invalid JSON.
- **onValidationError**: Runs when client-side validation fails.
- **showLoaderButton**: Whether to display a loader in the submit button. Defaults to `true`.
- **scrollToFirstErroredInput**: Whether to scroll to the first input with an error. Defaults to `true`.
- **focusFirstErroredInput**: Whether to focus the first invalid field. Defaults to `false`.
- **customTypeError**: Custom error type.
- **loaderColor**: Color of the loader in the submit button.
- **logging**: Specifies whether to log data to the console. Defaults to false.
- **validateOn**: Field live-validation events: `submit`, `input`, `blur`, `change`.
- **revalidateOn**: Events used to re-check already invalid fields. Defaults to `input` and `change`.
- **validationDebounce**: Live-validation delay in milliseconds.
- **errorContainerAttribute**: Attribute containing the CSS selector for a custom error container. Defaults to
  `data-error-container`.
- **validationStateAttribute**: Field state attribute: `validating`, `valid`, or `invalid`. Defaults to
  `data-form-father-state`.
- **observeMutations**: Watches dynamically added fields and submit buttons.
- **formValidators**: A form validator or array of validators for cross-field rules.

## Form Submission

- Submit elements are `button[type="submit"]`, `button` without `type`, `input[type="submit"]`, and
  `input[type="image"]`.
- `submit()` is public and returns `Promise<SubmitResult | undefined>`.
- For `method="GET"` and `method="HEAD"`, data is appended to the `action` query string and no request body is sent.
- `wrapData` applies to every supported `enctype`: `application/x-www-form-urlencoded`, `multipart/form-data`,
  `text/plain`, and `application/json`.
- `onResponseSuccess` runs only for a successful HTTP response with `success: true`.
- `onResponseUnsuccess` runs for unsuccessful HTTP responses, `success !== true`, or invalid JSON responses.

## Methods

- **Form.initAll(selector, options)**: Initializes all forms matching a selector and reuses existing instances.
- **updateOptions(options)**: Updates one form instance and rebinds live validation.
- **validate()**: Validates the whole form.
- **validateField(field)**: Validates one field by name or DOM element.
- **showFieldError(field, message, source)**: Shows a field error manually.
- **setErrors(errors, source)**: Applies backend/form-level errors from an object, array, or `ErrorResponse[]`.
- **getErrors()**: Returns current errors as `{ field, rule, message, source }`.
- **getValues()**: Returns form values as a plain object.
- **setValues(values)**: Fills fields by `name` and dispatches `input`/`change`.
- **clearErrors()**: Clears errors without changing field values.
- **reset(options)**: Calls native `form.reset()` and clears errors by default.
- **clearInputs()**: Clears all input fields in the form.
- **setDefaultParams(params):** The setDefaultParams method is used to set default values for all instances of the form. These parameters can be overridden when initializing a specific form.
- **destroy()**: Removes event listeners and runtime artifacts.

## Validation

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

- `data-validate` accepts rules separated by `|`, spaces, or commas.
- `data-error-rule-name` overrides a message for one rule.
- `data-error-container` points to a custom error container without requiring wrapper markup.
- During async validation, fields receive `aria-busy="true"` and a `validating` state attribute; stale validator
  responses are ignored.
- `data-custom-validate` is still supported for backward compatibility.

Final rule order:

```text
required  →  schema.rules  →  data-validate  →  data-custom-validate
```

### Cross-field and form-level validation

```ts
import { dateOrder, requiredIf, sameAsField } from 'form-father';

const form = new Form($form, {
	formValidators: [
		sameAsField('passwordConfirm', 'password', 'Passwords do not match'),
		requiredIf('email', ({ values }) => Boolean(values.subscribe), 'Email is required for subscription'),
		dateOrder('start', 'end', 'End date must be after start'),
	],
});
```

Return a string or an issue without `field` to show a form-level error. In `getErrors()`, it uses
`FORM_ERROR_FIELD` (`"_form"`).

```ts
form.setErrors({
	email: 'Email is already used',
	[FORM_ERROR_FIELD]: 'Please check the form',
});
```

### Rule DX helpers

```ts
import { createLengthValidator, createPatternValidator, registerFieldValidator } from 'form-father';

registerFieldValidator('starts-with-a', value => value.startsWith('A'), 'Must start with A');
registerValidator('slug', createPatternValidator(/^[a-z0-9-]+$/), 'Slug characters only');
registerValidator('short-name', createLengthValidator({ min: 2, max: 24 }), 'Use 2-24 characters');
```

## Schema Adapters

Form Father has no schema-library runtime dependency, but can wrap Zod/Valibot/Yup-like schemas with `safeParse()` or
`parse()`.

```ts
import { registerSchemaValidator } from 'form-father';

registerSchemaValidator('company-email', z.string().email(), 'Use a company email');
```

For simple checks, use `createFieldValidator(predicate, message)`.

## Demos and Recipes

- `demos/index.html` is a static login/callback/search/upload demo after `npm run build`.
- `npm run demos` builds the package and starts the Vite demo server.
- `docs/recipes/README.md` contains short API, data-attribute, adapter, and server-error recipes.

## Helpers

The library provides a number of utility functions:

- **serializeToFormData($element)**: Serializes form data into a `FormData` object.
- **isEmailValid(value)**: Checks if a string is a valid email address.
- **isUrlValid(value)**: Checks an `http(s)` URL, domain, IP, or `localhost`; the scheme may be omitted.
- **isPhoneValid(value)**: Checks if a string is a valid phone number.
- **closest($el, selector)**: Finds the closest parent element matching the given selector.
- **blockScrollBody()**: Blocks page scrolling.
- **unblockScrollBody()**: Unblocks page scrolling.
- **parseCommonResponseProperties(responseBody)**: Processes common properties from the server response.
- **serializeFormToJSON(form)**: Serializes form data into a plain object.

## Build and Development

**Rollup** is used for building the project. Main commands:

- **npm run build**: Builds the project.
- **npm run watch**: Builds the project in watch mode.
- **npm run demos**: Runs a demo version using Vite.

## Contributing

We welcome your suggestions and improvements! Please create [issues](https://github.com/poliklot/form-father/issues) and
submit [pull requests](https://github.com/poliklot/form-father/pulls).

## License

[MIT](LICENSE)

---

© 2024 Poliklot
