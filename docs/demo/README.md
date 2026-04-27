# Demo Guide

The demo is a static, dependency-light page that exercises common Form Father flows after a package build.

```bash
npm run build
npm run demos
```

Open the Vite URL printed by the command. The page loads `dist/FormFather.min.js` and `demos/main.js`, so it reflects the
actual browser bundle.

## Demo Forms

| Form | What it demonstrates |
| --- | --- |
| Login | Live validation, async validator state, password confirmation, and custom error containers. |
| Callback | Server-side field errors and form-level API errors. |
| Search | `GET` forms and query-string body handling. |
| Multipart | Browser-managed `FormData` upload flow. |
| Public API | `setValues()`, `validateField()`, `setErrors()`, `getValues()`, and `clearErrors()`. |

## Useful Manual Checks

- Enter `taken@example.com` in the Login email field to see async validation fail.
- Submit Callback with a valid phone to see backend field errors applied after the mocked response.
- Clear the Search query and submit to inspect the accessible error summary.
- Use Public API buttons to inspect programmatic state changes in the Output panel.

## Files

| File | Purpose |
| --- | --- |
| `demos/index.html` | Demo markup and forms. |
| `demos/main.js` | Mock API, validator registration, `Form.initAll()`, and public API playground actions. |
| `demos/styles.css` | Minimal UI styling for fields, summaries, output, and loading states. |

