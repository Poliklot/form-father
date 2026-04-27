# Form Father API Reference

This page is a compact reference for the public API exported by `form-father`.

## Main Import

```ts
import Form from 'form-father';
```

`Form` is the default export and is constructed with a native `<form>` element.

```ts
const form = new Form(document.querySelector('form')!, {
	inputWrapperSelector: '.field',
	validateOn: ['blur', 'change'],
	revalidateOn: ['input', 'change'],
	errorSummary: true,
});
```

## Form Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `inputSelector` | `string` | `.input` | Selector used by legacy input collection helpers. |
| `inputWrapperSelector` | `string` | `.input-primary` | Field wrapper selector used for inline error rendering. |
| `showLoaderButton` | `boolean` | `true` | Adds a loader to submit buttons while a request is pending. |
| `loaderColor` | `string` | `#fff` | Loader SVG color. |
| `scrollToFirstErroredInput` | `boolean` | `true` | Scrolls to the first invalid field. |
| `focusFirstErroredInput` | `boolean` | `false` | Focuses the first invalid field after validation. |
| `validateOn` | `ValidationTrigger | ValidationTrigger[]` | `submit` | Live validation triggers: `submit`, `input`, `blur`, `change`. |
| `revalidateOn` | `ValidationTrigger | ValidationTrigger[]` | `input`, `change` | Rechecks fields that are already invalid. |
| `validationDebounce` | `number` | `0` | Delay for live validation. |
| `validationSchema` | `ValidationSchema` | built in defaults | Field rules matched by selectors or `data-validate`. |
| `formValidators` | `FormValidator | FormValidator[]` | none | Cross-field and form-level validation. |
| `errorContainerAttribute` | `string` | `data-error-container` | Attribute containing a selector for a custom error container. |
| `validationStateAttribute` | `string` | `data-form-father-state` | Field state attribute: `validating`, `valid`, `invalid`. |
| `ariaDescribeErrors` | `boolean` | `true` | Links inline errors to fields with `aria-describedby`. |
| `errorIdPrefix` | `string` | `form-father-error` | Prefix for generated error element ids. |
| `errorSummary` | `boolean | ErrorSummaryOptions` | `false` | Enables an accessible form error summary. |
| `observeMutations` | `boolean` | `false` | Rebinds controls when fields/buttons are added dynamically. |
| `wrapData` | `(data) => data` | none | Transforms form values before request body creation. |
| `logging` | `boolean` | `false` | Logs submitted `FormData` values. |

## Lifecycle Callbacks

| Callback | When it runs |
| --- | --- |
| `onBeforeValidate(form)` | Before submit-time validation. |
| `onAfterValidate(isValid, form)` | After validation and before submit. |
| `onValidationError(errors, form)` | When client-side validation fails. |
| `onBeforeSubmit(form)` | Before a valid form is sent. Return `false` to cancel. |
| `onSubmit(form)` | When request sending starts. |
| `onResponse(body, form)` | After a response body is parsed. |
| `onResponseSuccess(body, form)` | For successful HTTP responses with `success: true`. |
| `onResponseUnsuccess(body, form)` | For non-OK responses, `success !== true`, or invalid JSON. |
| `onSubmitError(error, form)` | When sending or response parsing throws. |

## Instance Methods

| Method | Returns | Purpose |
| --- | --- | --- |
| `validate()` | `Promise<boolean>` | Validates the whole form. |
| `validateField(field)` | `Promise<boolean>` | Validates one field by `name` or element. |
| `submit()` | `Promise<SubmitResult | undefined>` | Sends the form programmatically. |
| `showFieldError(field, message, source?)` | `boolean` | Shows a field error manually. |
| `setErrors(errors, source?)` | `this` | Applies backend, form-level, or manual errors. |
| `getErrors()` | `ValidationError[]` | Returns current error records. |
| `getValues()` | `Record<string, any>` | Serializes the form into a plain object. |
| `setValues(values)` | `this` | Sets field values by `name` and dispatches `input`/`change`. |
| `clearErrors()` | `this` | Clears field and form errors. |
| `reset(options?)` | `this` | Calls native `form.reset()` and clears errors by default. |
| `clearInputs()` | `void` | Clears input values without resetting native defaults. |
| `updateOptions(options)` | `this` | Updates options and rebinds listeners. |
| `destroy()` | `void` | Removes listeners, loaders, error nodes, and runtime state. |

## Static Methods and Constants

```ts
Form.initAll('form[data-form-father]', options);
Form.setDefaultParams({ inputWrapperSelector: '.field' });
Form.defaultValidationSchema = {};
```

| Export | Purpose |
| --- | --- |
| `FORM_ERROR_FIELD` | Constant for form-level errors in `getErrors()` and `setErrors()`. |
| `Form.initAll(selector, options)` | Initializes matching forms and reuses existing instances. |
| `Form.setDefaultParams(params)` | Merges global default options for future instances. |
| `Form.defaultValidationSchema` | Global default validation schema. |

## Validators

```ts
import {
	createLengthValidator,
	createPatternValidator,
	registerFieldValidator,
	registerValidator,
} from 'form-father';
```

| Export | Purpose |
| --- | --- |
| `registerValidator(name, fn, message, options?)` | Registers a full validator. |
| `registerFieldValidator(name, predicate, message, options?)` | Registers a predicate-only field validator. |
| `getValidator(name)` | Reads one validator definition. |
| `getAllValidators()` | Reads the validator registry. |
| `createPatternValidator(pattern)` | Builds a regex validator. |
| `createLengthValidator(options)` | Builds min/max length validation. |

## Form Validators

```ts
import { dateOrder, requiredIf, sameAsField } from 'form-father';
```

| Export | Purpose |
| --- | --- |
| `createFormValidator(predicate, issue)` | Builds a reusable cross-field validator. |
| `sameAsField(field, otherField, message?, rule?)` | Checks that two values match. |
| `requiredIf(field, condition, message?, rule?)` | Makes a field required when a predicate is true. |
| `dateOrder(startField, endField, message?, rule?)` | Checks chronological field order. |

## Schema Adapters

```ts
import { createSchemaValidator, registerSchemaValidator } from 'form-father';
```

Adapters expect a schema-like object with either `safeParse(value)` or `parse(value)`.

| Export | Purpose |
| --- | --- |
| `createSchemaValidator(schema, message?)` | Converts a schema into a field validator function. |
| `registerSchemaValidator(name, schema, message?, options?)` | Registers a schema-backed rule. |
| `createFieldValidator(predicate, message)` | Creates a simple predicate validator. |

## Helpers

| Export | Purpose |
| --- | --- |
| `serializeToFormData(element)` | Serializes a form-like element into `FormData`. |
| `serializeFormToJSON(form)` | Serializes a form into a plain object. |
| `isEmailValid(value)` | Checks email format. |
| `isUrlValid(value)` | Checks URLs, domains, IPs, and `localhost`. |
| `isPhoneValid(value)` | Checks Russian `+7XXXXXXXXXX` phone numbers. |
| `closest(element, selector)` | Finds a closest matching ancestor. |
| `parseCommonResponseProperties(body)` | Normalizes common response flags. |
| `blockScrollBody()` | Locks body scrolling. |
| `unblockScrollBody()` | Restores body scrolling. |

