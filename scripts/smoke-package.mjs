import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const requiredFiles = [
	'dist/index.js',
	'dist/index.d.ts',
	'dist/FormFather.min.js',
	'README.md',
	'LICENSE',
	'RESPONSE_API.md',
	'CHANGELOG.md',
	'docs/api/README.md',
	'docs/demo/README.md',
	'docs/en/README.md',
	'docs/recipes/README.md',
	'demos/index.html',
];

const missingFiles = requiredFiles.filter(filePath => !fs.existsSync(path.join(rootDir, filePath)));
if (missingFiles.length > 0) {
	throw new Error(`Missing package files: ${missingFiles.join(', ')}`);
}

if (!packageJson.exports?.['.']?.import || !packageJson.exports?.['.']?.types) {
	throw new Error('package.json exports must expose both import and types entries');
}

const entrypoint = await import(pathToFileURL(path.join(rootDir, packageJson.exports['.'].import)).href);
const requiredExports = [
	'default',
	'FORM_ERROR_FIELD',
	'createFormValidator',
	'sameAsField',
	'requiredIf',
	'dateOrder',
	'registerValidator',
	'registerFieldValidator',
	'registerSchemaValidator',
	'getValidator',
	'getAllValidators',
	'createFieldValidator',
	'createSchemaValidator',
	'createPatternValidator',
	'createLengthValidator',
	'serializeToFormData',
	'serializeFormToJSON',
	'isEmailValid',
	'isUrlValid',
	'isPhoneValid',
	'closest',
	'parseCommonResponseProperties',
	'blockScrollBody',
	'unblockScrollBody',
];

const missingExports = requiredExports.filter(exportName => !(exportName in entrypoint));
if (missingExports.length > 0) {
	throw new Error(`Missing public exports: ${missingExports.join(', ')}`);
}

if (typeof entrypoint.default !== 'function') {
	throw new Error('Default export must be the Form constructor');
}

console.log(`Package smoke passed for ${packageJson.name}@${packageJson.version}`);
