# Form Father

[![npm version](https://img.shields.io/npm/v/form-father)](https://www.npmjs.com/package/form-father)
[![npm downloads](https://img.shields.io/npm/dm/form-father)](https://www.npmjs.com/package/form-father)

- [🇬🇧 English documentation](https://github.com/Poliklot/form-father/blob/master/docs/en/README.md)

**Form Father** — это библиотека для обработки форм на чистом JavaScript, обеспечивающая удобную валидацию и отправку
форм с использованием TypeScript.

## Установка

Установите библиотеку с помощью npm:

```bash
npm install form-father
```

## Использование

```html
	<form
		novalidate
		onsubmit="return false"
		method="post"
		action="/callback.php"
		enctype="multipart/form-data"
	>

		<!-- inputs -->

		<button type="submit">
			Отправить
		</button>
	</form>
```

```javascript
import Form, { isUrlValid, serializeToFormData } from 'form-father';

Form.setDefaultParams({
	showLoaderButton: false,
	scrollToFirstErroredInput: false,
	logging: false,
	loaderColor: 'currentColor',
});

const formElement = document.querySelector('#myForm');
const options = {
	onSubmit: formInstance => {
		// Действия при отправке формы
	},
	onResponse: (responseBody, formInstance) => {
		// Действия при получении ответа от сервера
		formInstance.clearInputs();
	},
	// Другие опции...
};

const form = new Form(formElement, options);
const simpleForm = new Form(document.querySelector('#simpleForm')); // options можно не передавать

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
	type ErrorSummaryOptions,
} from 'form-father';
```

## Формат ответов сервера

Данная библиотека абстрагирует процесс парсинга HTTP-ответов и выполняет действия на их основе. Для её корректной работы
сервер должен возвращать ответы в строго определённом формате. Полное описание формата (схемы) ответа от сервера
представлено в данном техническом документе:
[Спецификация формата ответов API.](https://github.com/Poliklot/form-father/blob/master/RESPONSE_API.md)

## Опции

- **onSubmit**: Функция обратного вызова, вызываемая при отправке формы.
- **onBeforeSubmit**: Функция вызывается перед отправкой уже валидной формы; `false` отменяет отправку.
- **onSubmitError**: Функция вызывается при исключении во время отправки.
- **onResponse**: Функция обратного вызова при получении ответа от сервера.
- **onResponseSuccess**: Функция вызывается при успешном HTTP-ответе и `success: true`.
- **onResponseUnsuccess**: Функция вызывается при неуспешном HTTP-ответе, `success !== true` или некорректном JSON.
- **onValidationError**: Функция вызывается, когда клиентская валидация не прошла.
- **showLoaderButton**: Показывать ли лоадер в кнопке отправки. По умолчанию `true`.
- **scrollToFirstErroredInput**: Прокручивать ли к первому полю с ошибкой. По умолчанию `true`.
- **focusFirstErroredInput**: Переводить ли фокус в первое поле с ошибкой. По умолчанию `false`.
- **customTypeError**: Кастомный тип ошибки.
- **loaderColor**: Цвет лоадера в кнопке отправки.
- **logging**: Нужно ли выводить данные в консоль. По умолчанию `false`.
- **validateOn**: События live-валидации поля: `submit`, `input`, `blur`, `change`.
- **revalidateOn**: События повторной проверки уже ошибочных полей. По умолчанию `input` и `change`.
- **validationDebounce**: Задержка live-валидации в миллисекундах.
- **errorContainerAttribute**: Атрибут с CSS-селектором контейнера ошибки. По умолчанию `data-error-container`.
- **validationStateAttribute**: Атрибут состояния поля: `validating`, `valid`, `invalid`. По умолчанию
  `data-form-father-state`.
- **ariaDescribeErrors**: Связывать inline-ошибку с полем через `aria-describedby`. По умолчанию `true`.
- **errorIdPrefix**: Префикс id для автоматически созданных элементов ошибок. По умолчанию `form-father-error`.
- **errorSummary**: Summary ошибок формы: `true` для дефолтного блока или объект `{ selector, title, focus, render }`.
- **observeMutations**: Следить за динамически добавленными полями и submit-кнопками.
- **formValidators**: Валидатор или массив валидаторов всей формы для cross-field правил.

## Отправка формы

- Submit-элементами считаются `button[type="submit"]`, `button` без `type`, `input[type="submit"]` и
  `input[type="image"]`.
- `submit()` доступен публично и возвращает `Promise<SubmitResult | undefined>`.
- Для `method="GET"` и `method="HEAD"` данные добавляются в query string `action`, тело запроса не отправляется.
- `wrapData` применяется для всех поддержанных `enctype`: `application/x-www-form-urlencoded`, `multipart/form-data`,
  `text/plain`, `application/json`.
- `onResponseSuccess` вызывается только при успешном HTTP-ответе и `success: true`.
- `onResponseUnsuccess` вызывается при неуспешном HTTP-ответе, `success !== true` или некорректном JSON-ответе.

## Методы

- **Form.initAll(selector, options)**: Инициализирует все формы по селектору и переиспользует уже созданные инстансы.
- **updateOptions(options)**: Обновляет настройки конкретной формы и перепривязывает live-валидацию.
- **validate()**: Проверяет всю форму.
- **validateField(field)**: Проверяет одно поле по имени или DOM-элементу.
- **showFieldError(field, message, source)**: Показывает ошибку поля вручную.
- **setErrors(errors, source)**: Применяет backend/form-level ошибки из объекта, массива или `ErrorResponse[]`.
- **getErrors()**: Возвращает текущие ошибки в формате `{ field, rule, message, source }`.
- **getValues()**: Возвращает значения формы обычным объектом.
- **setValues(values)**: Заполняет поля по `name` и диспатчит `input`/`change`.
- **clearErrors()**: Очищает ошибки, не меняя значения полей.
- **reset(options)**: Вызывает native `form.reset()` и по умолчанию очищает ошибки.
- **clearInputs()**: Очищает все поля ввода формы.
- **setDefaultParams(params)**: Метод setDefaultParams используется для установки значений по умолчанию для всех
  экземпляров формы. Эти параметры можно переопределить при инициализации конкретной формы.
- **destroy()**: Очищает инициализацию формы.

## Хелперы

Библиотека предоставляет ряд вспомогательных функций:

- **serializeToFormData($element)**: Сериализует данные формы в объект `FormData`.
- **isEmailValid(value)**: Проверяет, является ли строка валидным адресом электронной почты.
- **isUrlValid(value)**: Проверяет `http(s)`-адрес, домен, IP, `localhost`, схема может быть опущена.
- **isPhoneValid(value)**: Проверяет, является ли строка валидным номером телефона.
- **closest($el, selector)**: Находит ближайший родительский элемент по заданному селектору.
- **blockScrollBody()**: Блокирует прокрутку страницы.
- **unblockScrollBody()**: Разблокирует прокрутку страницы.
- **parseCommonResponseProperties(responseBody)**: Обрабатывает общие свойства ответа сервера.
- **serializeFormToJSON(form)**: Сериализует данные формы в обычный объект.

## Валидаторы

Form Father поставляется с базовым набором правил валидации, а также позволяет легко добавлять и переопределять
собственные.

### Базовые правила

| Ключ          | Проверка                        | Сообщение по умолчанию |
| ------------- | ------------------------------- | ---------------------- |
| `required`    | значение непустое               | **Пустое значение**    |
| `email`       | валидный e-mail                 | **Неверный формат**    |
| `tel`         | российский номер `+7XXXXXXXXXX` | **Неверный формат**    |
| `url`         | домен/IP/localhost, схема optional | **Неверный формат**    |
| `not-numbers` | строка без цифр                 | **Неверный формат**    |

> [!NOTE] Полный список валидаторов можно получить так:
>
> ```js
> import { getAllValidators } from 'form-father';
>
> const all = getAllValidators();
> console.log([...all.keys()]);
> ```

---

### Глобальная схема (`Form.defaultValidationSchema`)

```ts
Form.defaultValidationSchema = {
	email: {
		selector: 'input[type="email"]', // CSS-селектор, по которому выбираются inputs
		rules: ['required', 'email'],
	},
	tel: {
		selector: 'input[type="tel"]',
		rules: ['required', 'tel'],
	},
};
```

- **selector** — произвольный CSS. Если он указан, правила применяются ко всем элементам, соответствующим этому
  селектору. Если селектора нет, библиотека использует атрибут `data-validate`.
- Ту же схему можно переопределить/дополнить локально через `validationSchema` при инициализации формы.

---

### Локальная схема (`validationSchema`)

```ts
const form = new Form($form, {
	validationSchema: {
		tel: {
			// ключ произвольный
			selector: '[data-validate="tel"]',
			rules: ['tel', 'begin+79277'],
			messages: {
				tel: 'Телефон в формате +7…',
				'begin+79277': 'Номер должен начинаться на +79277',
			},
		},
	},
});
```

_Порядок применения для одного `<input>`:_

1. `required` (если атрибут `required`)
2. правила из `validationSchema`
3. правила из `data-custom-validate`

---

### Правила через data-атрибуты

```html
<input
	name="email"
	type="email"
	data-validate="required|email"
	data-error-required="Email обязателен"
	data-error-email="Введите корректный email"
	data-error-container="#email-error"
/>
<small id="email-error" hidden></small>
```

- `data-validate` принимает правила через `|`, пробел или запятую.
- `data-error-rule-name` переопределяет сообщение конкретного правила.
- `data-error-container` указывает контейнер для ошибки без обязательной wrapper-разметки.
- Во время async-валидации поле получает `aria-busy="true"` и state-атрибут `validating`; устаревшие ответы
  валидаторов игнорируются.
- Inline-ошибки автоматически получают `role="alert"` и связываются с полем через `aria-describedby`.
- `data-custom-validate` сохранён для обратной совместимости.

### Error summary и a11y

```html
<form data-form-father novalidate>
	<div data-form-father-summary hidden></div>
	<label>
		Email
		<input class="input" name="email" data-validate="required|email" />
	</label>
	<button type="submit">Отправить</button>
</form>
```

```ts
new Form($form, {
	inputWrapperSelector: 'label',
	errorSummary: {
		title: 'Проверьте форму',
		focus: true,
	},
});
```

- Если в форме уже есть `[data-form-father-summary]`, библиотека использует его; иначе при `errorSummary: true` создаёт
  блок в начале формы.
- `selector` позволяет отдать summary в свой контейнер.
- `render(errors, form)` позволяет полностью заменить разметку summary.
- `ariaDescribeErrors: false` отключает автоматическое добавление id ошибки в `aria-describedby`.

### Правило через `data-custom-validate`

```html
<input name="code" data-custom-validate="only-digits:6" required />
```

- Если правило неизвестно, в консоль выводится `[FormFather] Unknown validation rule "foo"`.

---

### Собственный валидатор

```ts
import { registerValidator } from 'form-father';

registerValidator(
	'only-digits',
	(v, _input, _form, len) => new RegExp(`^\d{${len}}$`).test(v),
	'Допустимы только цифры',
);
```

Теперь можно использовать:

```html
<input name="code" data-custom-validate="only-digits:6" required />
```

---

### Переопределение валидатора

```ts
registerValidator(
	'tel',
	v => /^8\d{10}$/.test(v), // новая проверка
	'Номер должен начинаться на 8…', // новое сообщение
	{ override: true }, // ← обязательно!
);
```

_Без `override: true` библиотека оставит старую версию и выведет warn._

---

### Изменение только текста ошибки

#### Глобально

```ts
const vd = getValidator('email');
if (vd) vd.defaultMessage = 'Некорректный e-mail';
```

#### Локально для формы

```ts
validationSchema: {
  email: {
    selector: 'input[type="email"]',
    rules: ['email'],
    messages: { email: 'Некорректный e-mail' },
  },
}
```

---

### Итоговый порядок проверки

```
required  →  schema.rules  →  data-validate  →  data-custom-validate
```

- Для каждого поля отображается **только первое** найденное сообщение об ошибке.
- Неизвестные правила логируются и пропускаются до начала проверки, поэтому не влияют на результат валидации.

### Cross-field и form-level validation

```ts
import { dateOrder, requiredIf, sameAsField } from 'form-father';

const form = new Form($form, {
	formValidators: [
		sameAsField('passwordConfirm', 'password', 'Пароли не совпадают'),
		requiredIf('email', ({ values }) => Boolean(values.subscribe), 'Email обязателен для подписки'),
		dateOrder('start', 'end', 'Дата окончания раньше начала'),
	],
});
```

Глобальную ошибку формы можно вернуть строкой или issue без `field`. В `getErrors()` она будет иметь поле
`FORM_ERROR_FIELD` (`"_form"`).

```ts
form.setErrors({
	email: 'Email уже занят',
	[FORM_ERROR_FIELD]: 'Проверьте данные формы',
});
```

### DX helpers для правил

```ts
import { createLengthValidator, createPatternValidator, registerFieldValidator } from 'form-father';

registerFieldValidator('starts-with-a', value => value.startsWith('A'), 'Должно начинаться с A');
registerValidator('slug', createPatternValidator(/^[a-z0-9-]+$/), 'Только slug-символы');
registerValidator('short-name', createLengthValidator({ min: 2, max: 24 }), 'От 2 до 24 символов');
```

## Адаптеры схем

Form Father не тянет внешние зависимости, но умеет оборачивать Zod/Valibot/Yup-подобные схемы с `safeParse()` или
`parse()`.

```ts
import { registerSchemaValidator } from 'form-father';

registerSchemaValidator('company-email', z.string().email(), 'Введите корпоративный email');
```

Для простых проверок есть `createFieldValidator(predicate, message)`.

## Демо и рецепты

- `demos/index.html` — статическое демо login/callback/search/upload/public API после `npm run build`.
- `npm run demos` — сборка и запуск Vite-сервера для демо.
- `docs/api/README.md` — компактный справочник публичного API, опций, методов и экспортов.
- `docs/demo/README.md` — сценарии ручной проверки демо и описание demo forms.
- `docs/recipes/README.md` — короткие рецепты по API, data-атрибутам, adapters и server errors.
- `CHANGELOG.md` — история релизов и baseline покрытия.

## Сборка и разработка

Для сборки проекта используется **Rollup**. Основные команды:

- **npm run build**: Сборка проекта.
- **npm run watch**: Сборка в режиме наблюдения.
- **npm run docs:check**: Проверка версии, ссылок документации, demo-файлов и package README.
- **npm run demos**: Запуск демо-версии с использованием Vite.

## Вклад

Будем рады вашим предложениям и улучшениям! Пожалуйста, создавайте
[issues](https://github.com/poliklot/form-father/issues) и отправляйте
[pull requests](https://github.com/poliklot/form-father/pulls).

## Лицензия

[MIT](LICENSE)

© 2025 Poliklot
