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
	'demos/main.js',
	'demos/styles.css',
];

const missingFiles = requiredFiles.filter(filePath => !fs.existsSync(path.join(rootDir, filePath)));
if (missingFiles.length > 0) {
	throw new Error(`Missing package files: ${missingFiles.join(', ')}`);
}

const expectedDemoPackageFiles = ['demos/index.html', 'demos/main.js', 'demos/styles.css'];
const missingDemoPackageEntries = expectedDemoPackageFiles.filter(filePath => !packageJson.files?.includes(filePath));
if (missingDemoPackageEntries.length > 0) {
	throw new Error(`Missing explicit demo package entries: ${missingDemoPackageEntries.join(', ')}`);
}

if (packageJson.files.includes('demos')) {
	throw new Error('package.json files must not include the whole demos directory');
}

if (!packageJson.exports?.['.']?.import || !packageJson.exports?.['.']?.types) {
	throw new Error('package.json exports must expose both import and types entries');
}

if (packageJson.main !== './dist/index.js') {
	throw new Error('package.json main must point to dist/index.js');
}

if (packageJson.module !== './dist/index.js') {
	throw new Error('package.json module must point to dist/index.js');
}

if (packageJson.types !== './dist/index.d.ts') {
	throw new Error('package.json types must point to dist/index.d.ts');
}

if (packageJson.exports['.'].default !== './dist/index.js') {
	throw new Error('package.json root export must include a default condition');
}

if (packageJson.exports['./FormFather.min.js'] !== './dist/FormFather.min.js') {
	throw new Error('package.json must expose the IIFE bundle subpath');
}

if (packageJson.unpkg !== './dist/FormFather.min.js' || packageJson.jsdelivr !== './dist/FormFather.min.js') {
	throw new Error('package.json CDN entries must point to the IIFE bundle');
}

const entrypoint = await import(pathToFileURL(path.join(rootDir, packageJson.exports['.'].import)).href);
const packageEntrypoint = await import(packageJson.name);
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

const missingPackageExports = requiredExports.filter(exportName => !(exportName in packageEntrypoint));
if (missingPackageExports.length > 0) {
	throw new Error(`Missing package self-reference exports: ${missingPackageExports.join(', ')}`);
}

if (typeof packageEntrypoint.default !== 'function') {
	throw new Error('Package self-reference default export must be the Form constructor');
}

console.log(`Package smoke passed for ${packageJson.name}@${packageJson.version}`);
