const api = window.FormFather || {};
const Form = api.default || api.Form || api;
const { createLengthValidator, registerValidator, sameAsField } = api;
const output = document.querySelector('#demo-output');

function writeOutput(title, payload) {
	output.textContent = `${title}\n\n${JSON.stringify(payload, null, 2)}`;
}

function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

window.fetch = async (url, options = {}) => {
	const requestUrl = String(url);
	const method = options.method || 'GET';

	if (requestUrl.startsWith('/demo/login')) {
		return json({
			success: true,
			message: 'Logged in',
			method,
		});
	}

	if (requestUrl.startsWith('/demo/callback')) {
		return json(
			{
				success: false,
				error: true,
				'error-msg': 'Сервер вернул ошибки по полям.',
				errors: [{ name: 'tel', 'error-msg': 'Этот номер уже есть в заявках' }],
			},
			422,
		);
	}

	if (requestUrl.startsWith('/demo/search')) {
		return json({
			success: true,
			query: requestUrl,
			results: ['Validation API', 'Server response format', 'Demo recipes'],
		});
	}

	if (requestUrl.startsWith('/demo/upload')) {
		return json({
			success: true,
			message: 'FormData accepted',
			contentType: options.headers?.['Content-Type'] || 'browser-managed multipart boundary',
		});
	}

	return json({ success: false, error: true, 'error-msg': `No demo route for ${requestUrl}` }, 404);
};

registerValidator('min-length', createLengthValidator({ min: 6 }), 'Слишком короткое значение', { override: true });
registerValidator(
	'available-email',
	value =>
		new Promise(resolve => {
			setTimeout(() => resolve(value.toLowerCase() !== 'taken@example.com'), 350);
		}),
	'Email is already used',
	{ override: true },
);

Form.initAll('form[data-form-father]', {
	inputSelector: '.input',
	inputWrapperSelector: '.field',
	validateOn: ['blur', 'change'],
	revalidateOn: ['input', 'change'],
	validationDebounce: 120,
	focusFirstErroredInput: true,
	loaderColor: 'currentColor',
	errorSummary: {
		title: 'Проверьте поля формы',
		focus: true,
	},
	formValidators: sameAsField('passwordConfirm', 'password', 'Пароли не совпадают'),
	onValidationError(errors) {
		writeOutput('Client validation errors', errors);
	},
	onResponse(responseBody, form) {
		writeOutput(`${form.$el.dataset.demo || 'form'} response`, responseBody);
	},
	onResponseSuccess(responseBody, form) {
		if (form.$el.dataset.demo === 'login' || form.$el.dataset.demo === 'upload') {
			form.clearInputs();
		}
	},
});
