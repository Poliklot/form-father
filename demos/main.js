const api = window.FormFather || {};
const Form = api.default || api.Form || api;
const { FORM_ERROR_FIELD, createLengthValidator, registerValidator, sameAsField } = api;
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

	if (requestUrl.startsWith('/demo/api')) {
		return json({
			success: true,
			message: 'Programmatic API form accepted',
			method,
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

const forms = Form.initAll('form[data-form-father]', {
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

const formByDemo = new Map(forms.map(form => [form.$el.dataset.demo, form]));
const apiForm = formByDemo.get('api');

document.querySelectorAll('[data-api-action]').forEach(button => {
	button.addEventListener('click', async () => {
		if (!apiForm) return;

		switch (button.dataset.apiAction) {
			case 'fill':
				apiForm.setValues({
					name: 'Ada Lovelace',
					email: 'ada@example.com',
					plan: 'team',
				});
				writeOutput('setValues()', apiForm.getValues());
				break;

			case 'validate-email': {
				const valid = await apiForm.validateField('email');
				writeOutput('validateField("email")', {
					valid,
					errors: apiForm.getErrors(),
				});
				break;
			}

			case 'server-errors':
				apiForm.setErrors({
					email: 'Этот email уже зарегистрирован',
					[FORM_ERROR_FIELD]: 'Сервер попросил проверить форму',
				});
				writeOutput('setErrors()', apiForm.getErrors());
				break;

			case 'values':
				writeOutput('getValues()', apiForm.getValues());
				break;

			case 'clear':
				apiForm.clearErrors();
				writeOutput('clearErrors()', apiForm.getErrors());
				break;
		}
	});
});
