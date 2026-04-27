# Changelog

All notable changes to this project are documented here.

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
