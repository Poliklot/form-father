# Changelog

All notable changes to this project are documented here.

## [0.8.4](https://github.com/Poliklot/form-father/compare/form-father-v0.8.3...form-father-v0.8.4) (2026-06-29)


### Bug Fixes

* **deps-dev:** update development dependencies ([0c29f98](https://github.com/Poliklot/form-father/commit/0c29f98d3376523d1d3c94099a39d355f5f5cebb))

## [0.8.3](https://github.com/Poliklot/form-father/compare/form-father-v0.8.2...form-father-v0.8.3) (2026-06-22)


### Bug Fixes

* avoid unsafe error id regex trimming ([0c9dca8](https://github.com/Poliklot/form-father/commit/0c9dca873c5c7677baffc7381912fcef0fdd9f71))

## [0.8.2](https://github.com/Poliklot/form-father/compare/form-father-v0.8.1...form-father-v0.8.2) (2026-06-18)


### Security

* Override `js-yaml` to `4.2.0` to close the remaining Dependabot security alert.
* Update vulnerable build dependencies, including `serialize-javascript`, `vite`, and `esbuild`.


### Build

* Update Rollup, Babel, PostCSS, and TypeScript build tooling.
* Set explicit TypeScript `rootDir` and DOM/ES2019 library targets for stable declaration builds.


### Tests

* Configure Jest TypeScript globals for the TypeScript 6 test run.

## [0.8.1](https://github.com/Poliklot/form-father/compare/form-father-v0.8.0...form-father-v0.8.1) (2026-06-18)


### Bug Fixes

* accept Release Please changelog format ([d1bfe42](https://github.com/Poliklot/form-father/commit/d1bfe426d25d93bedb6ccf23406fd546a929a7bd))

## [0.8.0](https://github.com/Poliklot/form-father/compare/form-father-v0.7.1...form-father-v0.8.0) (2026-06-18)


### Features

* Добавлен экспорт всех функций их валидаторов. ([a98d9cf](https://github.com/Poliklot/form-father/commit/a98d9cfc5500d5ffc6b4259cd195fd0bec2e76e0))
* Добавлены 2 колбэка до валидации и после. ([27830c7](https://github.com/Poliklot/form-father/commit/27830c72f0335071a3693d165ed2b8d267504472))
* добавлены checkbox в clearInputs ([b4109a9](https://github.com/Poliklot/form-father/commit/b4109a94de4007a51ef497b37493aef6d4389084))
* Добавлены конфиги для редактора. ([e47f6b9](https://github.com/Poliklot/form-father/commit/e47f6b9c090bf7cdc76ceebd1ff65f88a7852730))
* добавлены свойства reload-delay и redirect-url-delay в ответе для задержки reload или redirect после ответа с сервера ([1575892](https://github.com/Poliklot/form-father/commit/157589223247fa26a588ddb8c8430810097ee3e1))
* добавлены свойства reload-delay и redirect-url-delay в ответе для задержки reload или redirect после ответа с сервера ([52d38b5](https://github.com/Poliklot/form-father/commit/52d38b52cd2b2ce2b6a3257945eab41e66182186))
* доработан README про redirect-url-delay & reload-delay & и перенесён RESPONSE_API из отдельного гиста https://gist.github.com/Poliklot/4916c87acf77c0a57c46c08ae2672299 ([2fe0339](https://github.com/Poliklot/form-father/commit/2fe0339b60319fad3e486de5fbf8cd3837add54c))
* доработана валидация URL ([398591c](https://github.com/Poliklot/form-father/commit/398591c4154df9b07a060b8e96b2c2cbc0c2e6f1))
* Доработана реализация валидатора required и тесты к нему. ([ed68350](https://github.com/Poliklot/form-father/commit/ed683502858f9579cccfc5113e98773eee8b86e9))
* Доработки по toast. ([c9c3e02](https://github.com/Poliklot/form-father/commit/c9c3e022ebf034eae8210db6f882ad2497aa84ba))
* Исправлен хардкод вызывающий toast. ([d0920de](https://github.com/Poliklot/form-father/commit/d0920decfe8c7efbd73ddc3772fc790376db116f))
* отменено всплытие дефолтного submit к document ([4d3e962](https://github.com/Poliklot/form-father/commit/4d3e9629c5cce822065437db66bc0fada44be82a))
* отменено всплытие дефолтного submit к document ([4df6d64](https://github.com/Poliklot/form-father/commit/4df6d6469dc2f899ece209170de93f66a7fd2240))
* отменено поведение при клике ([ddde968](https://github.com/Poliklot/form-father/commit/ddde9680b7cede4a0eb0ce1cb6aeb20cfe5193d0))
* отменено поведение при клике ([d7ed0a5](https://github.com/Poliklot/form-father/commit/d7ed0a5877da68232cfe308f625f02b869a40b18))
* проработан случай нескольких submit-кнопок ([a598b36](https://github.com/Poliklot/form-father/commit/a598b36cb8b5eafe7ead324f2df9b3ada670f742))
* Раширен API валидаторов. ([3050de9](https://github.com/Poliklot/form-father/commit/3050de95f75bf066a92d4673d1bd9ceb19a60b9c))
* Реализован публичный метод destroy. ([b8dee71](https://github.com/Poliklot/form-father/commit/b8dee71e8cc711d1b3361b92a5be11bfef78c566))
* Реализована анимация появления ошибки у формы. ([cb26d9e](https://github.com/Poliklot/form-father/commit/cb26d9e8313ec01c8b64afda3479df65a5ba833b))
* Реализована возможность валидации отдельных частей формы. ([bd2d5b7](https://github.com/Poliklot/form-father/commit/bd2d5b7b3b367e8d808f90e911fc3aeed10c61b6))
* Реализовано 2 дата-атрибута для отключения валидации и скролла до элемента. ([ce95a6b](https://github.com/Poliklot/form-father/commit/ce95a6be6b66c00ea7eb0af6ea3b91d0129515b2))
* Реализованы валидаторы. ([1018d4c](https://github.com/Poliklot/form-father/commit/1018d4c775107ac7568a59df962f22e0244aa450))
* Реализованы тесты ([cf4fd76](https://github.com/Poliklot/form-father/commit/cf4fd76a36846e006421db87df18c01ee47d53c0))


### Bug Fixes

* publish package entrypoints ([bc379bf](https://github.com/Poliklot/form-father/commit/bc379bff2d0f57eb836c245cf5a038530df5d5d8))
* Исправлена проблема потери дефолтных параметров в разных скриптах. ([cdecba6](https://github.com/Poliklot/form-father/commit/cdecba6be3fce67d7d8264ce3e57d8a7d0fc89d8))
* Исправлены жесткие селекторы. ([d906319](https://github.com/Poliklot/form-father/commit/d906319c14de868b6ea12012134b1e4fe517a580))

## 0.7.1 - 2026-05-19

### Fixed

- Added explicit npm package entrypoints (`main`, `module`, `types`, `exports.default`, CDN fields) for compatibility with webpack and TypeScript consumers using classic Node module resolution.
- Synchronized the flattened publish manifest in `package/package.json` with the root package metadata.

## 0.7.0 - 2026-04-27

### Added

- Added `docs/api/README.md` with a compact public API, options, methods, validators, adapters, and helpers reference.
- Added `docs/demo/README.md` with manual demo scenarios and demo coverage notes.
- Added a Public API demo panel covering `setValues()`, `validateField()`, `setErrors()`, `getValues()`, and
  `clearErrors()`.
- Added `npm run docs:check` to verify documentation files, version references, package README sync, and demo coverage.

### Changed

- `npm run release:check` now includes documentation checks before build and package smoke checks.
- Package smoke checks now verify the broader public export surface and package documentation files.

### Tests

- Release gate remains at 122 tests plus docs/package smoke checks.

## 0.6.0 - 2026-04-27

### Added

- Added accessible field error wiring via `aria-describedby` with safe preservation of existing descriptions.
- Added `errorSummary` option with default rendering, custom selector support, focus control, and custom renderers.
- Added `ariaDescribeErrors` and `errorIdPrefix` options for UI/a11y integration control.

### Changed

- Field, form-level, backend, and manual errors can now share one visible summary while keeping the existing inline error
  rendering path.
- Demo forms now include accessible error summaries.

### Tests

- Test suite expanded to 122 tests.
- Coverage baseline: 98.30% statements, 86.88% branches, 97.25% functions, 100% lines.

## 0.5.0 - 2026-04-27

### Added

- Added field validator DX helpers: `registerFieldValidator()`, `createPatternValidator()`, and
  `createLengthValidator()`.
- Added form validator DX helpers: `createFormValidator()`, `sameAsField()`, `requiredIf()`, and `dateOrder()`.
- Added helper types for reusable form validator predicates and issue factories.

### Changed

- Demo and documentation now use higher-level helper APIs for common password-confirm and validation rule recipes.

### Tests

- Test suite expanded to 115 tests.
- Coverage baseline: 98.19% statements, 86.91% branches, 97.04% functions, 100% lines.

## 0.4.0 - 2026-04-27

### Added

- Added form-level and cross-field validation via `formValidators`.
- Added `setErrors()` for backend maps, `ErrorResponse[]`, global form errors, and custom validation issue objects.
- Added `FORM_ERROR_FIELD` constant for form-level errors in `getErrors()`.
- Added public TypeScript types for form validation contexts and issues.

### Changed

- `validate()` now runs field-level rules first, then form-level validators over `getValues()`.
- Cross-field and backend errors share the same rendering path as field validation errors.

### Tests

- Test suite expanded to 113 tests.
- Coverage baseline: 98.31% statements, 87.05% branches, 96.34% functions, 100% lines.

## 0.3.0 - 2026-04-25

### Added

- Added convenience API: `Form.initAll()`, `updateOptions()`, public `submit()`, `validateField()`, `showFieldError()`,
  `getErrors()`, `getValues()`, `setValues()`, `clearErrors()`, and `reset()`.
- Added client validation hooks: `onValidationError`, `onBeforeSubmit`, and `onSubmitError`.
- Added live validation options: `validateOn`, `revalidateOn`, `validationDebounce`, and `focusFirstErroredInput`.
- Added `data-validate`, `data-error-*`, and `data-error-container` support while keeping `data-custom-validate`.
- Added optional mutation observing for dynamic fields and submit buttons.
- Added race-safe async field validation state with `aria-busy` and configurable field state attributes.
- Added dependency-free schema adapters: `createSchemaValidator()`, `registerSchemaValidator()`, and
  `createFieldValidator()`.
- Added static demos for login, callback/server errors, GET search, and multipart upload.
- Added recipes documentation for common API, data-attribute, adapter, and server-error flows.

### Changed

- Validation now merges every matching schema rule for a field before applying data-attribute rules.
- Server-side field errors now populate the public `getErrors()` list.
- Package contents now include docs, demos, and the changelog.

### Tests

- Test suite expanded to 109 tests.
- Coverage baseline: 98.10% statements, 86.15% branches, 95.69% functions, 100% lines.

## 0.2.11 - 2026-04-25

### Added

- Added release checklist, package smoke checks, CI workflow, and release gate scripts.
- Added npm pack dry-run script with a temporary npm cache for local cache permission issues.

### Changed

- Updated package metadata and release workflow after `0.2.10` had already been published.

## 0.2.10 - 2026-04-25

### Added

- Exported public helper APIs from the package entrypoint: `serializeToFormData`, validators, URL/email/phone helpers, scroll helpers, and response helpers.
- Exported TypeScript types for public consumers: `FormOptions`, `ValidationRule`, `ValidationSchema`, `ErrorResponse`, and `ResponseBody`.
- Added package smoke checks for built files and public exports.
- Added CI workflow for tests, build, smoke checks, and npm pack dry-run.
- Added coverage thresholds to keep the stabilization baseline from regressing.

### Changed

- `new Form(formEl)` now works without an options object.
- Submit detection now supports implicit submit buttons (`<button>`) and `input[type="image"]`.
- `GET` and `HEAD` forms now append form data to the action query string and do not send a request body.
- `wrapData` now applies consistently across supported encodings: `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`, and `application/json`.
- Non-200 HTTP responses, `success !== true`, and invalid JSON responses now flow through `onResponseUnsuccess`.
- Server-side field errors can be applied to `input`, `textarea`, and `select`.
- `serializeToFormData` now skips disabled controls, controls marked with `data-no-serialize`, and button controls.
- Built-in validators are registered idempotently across repeated module imports.

### Fixed

- Loader and `waitResponse` cleanup now runs when `fetch` or response parsing fails.
- Required radio groups now produce one validation error per group.
- Field error rendering no longer requires a wrapper-level `showError()` method.
- Release script now exits with `0` on success and handles missing temporary files during cleanup.
- Rollup IIFE build no longer warns about mixed default and named exports.

### Tests

- Test coverage baseline: 98.32% statements, 86.34% branches, 93.18% functions, 100% lines.
- Test suite baseline: 93 tests passing.

## 0.2.9

- Previous published patch release.
