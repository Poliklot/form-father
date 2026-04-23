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
import Form from 'form-father';

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
```

## Формат ответов сервера

Данная библиотека абстрагирует процесс парсинга HTTP-ответов и выполняет действия на их основе. Для её корректной работы
сервер должен возвращать ответы в строго определённом формате. Полное описание формата (схемы) ответа от сервера
представлено в данном техническом документе:
[Спецификация формата ответов API.](https://github.com/Poliklot/form-father/blob/master/RESPONSE_API.md)

## Опции

- **onSubmit**: Функция обратного вызова, вызываемая при отправке формы.
- **onResponse**: Функция обратного вызова при получении ответа от сервера.
- **onResponseSuccess**: Функция вызывается при успешном ответе сервера (статус 200).
- **onResponseUnsuccess**: Функция вызывается при неуспешном ответе сервера (статус не 200).
- **showLoaderButton**: Показывать ли лоадер в кнопке отправки. По умолчанию `true`.
- **scrollToFirstErroredInput**: Прокручивать ли к первому полю с ошибкой. По умолчанию `true`.
- **customTypeError**: Кастомный тип ошибки.
- **loaderColor**: Цвет лоадера в кнопке отправки.
- **logging**: Нужно ли выводить данные в консоль. По умолчанию `false`.

## Методы

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
required  →  schema.rules  →  data-custom-validate
```

- Для каждого поля отображается **только первое** найденное сообщение об ошибке.
- Неизвестные правила логируются и пропускаются до начала проверки, поэтому не влияют на результат валидации.

## Сборка и разработка

Для сборки проекта используется **Rollup**. Основные команды:

- **npm run build**: Сборка проекта.
- **npm run watch**: Сборка в режиме наблюдения.
- **npm run demos**: Запуск демо-версии с использованием Vite.

## Вклад

Будем рады вашим предложениям и улучшениям! Пожалуйста, создавайте
[issues](https://github.com/poliklot/form-father/issues) и отправляйте
[pull requests](https://github.com/poliklot/form-father/pulls).

## Лицензия

[MIT](LICENSE)

© 2025 Poliklot
