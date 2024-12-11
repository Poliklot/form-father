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
import Form from 'form-father';

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
```

## Options

- **onSubmit**: Callback function executed on form submission.
- **onResponse**: Callback function executed when a server response is received.
- **onResponseSuccess**: Callback function executed on successful server response (status 200).
- **onResponseUnsuccess**: Callback function executed on unsuccessful server response (non-200 status).
- **showLoaderButton**: Whether to display a loader in the submit button. Defaults to `true`.
- **scrollToFirstErroredInput**: Whether to scroll to the first input with an error. Defaults to `true`.
- **customTypeError**: Custom error type.
- **loaderColor**: Color of the loader in the submit button.
- **logging**: Specifies whether to log data to the console. Defaults to false.

## Methods

- **clearInputs()**: Clears all input fields in the form.
- **setDefaultParams(params):** The setDefaultParams method is used to set default values for all instances of the form. These parameters can be overridden when initializing a specific form.

## Helpers

The library provides a number of utility functions:

- **serializeToFormData($element)**: Serializes form data into a `FormData` object.
- **isEmailValid(value)**: Checks if a string is a valid email address.
- **isUrlValid(value)**: Checks if a string is a valid URL.
- **isPhoneValid(value)**: Checks if a string is a valid phone number.
- **closest($el, selector)**: Finds the closest parent element matching the given selector.
- **blockScrollBody()**: Blocks page scrolling.
- **unblockScrollBody()**: Unblocks page scrolling.
- **parseCommonResponseProperties(responseBody)**: Processes common properties from the server response.

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
