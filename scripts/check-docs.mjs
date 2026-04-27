import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function read(filePath) {
	return fs.readFileSync(path.join(rootDir, filePath), 'utf8');
}

function readJson(filePath) {
	return JSON.parse(read(filePath));
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function assertFile(filePath) {
	assert(fs.existsSync(path.join(rootDir, filePath)), `Missing documentation file: ${filePath}`);
}

const packageJson = readJson('package.json');
const packagePackageJson = readJson('package/package.json');
const version = packageJson.version;

assert(packagePackageJson.version === version, 'package/package.json version must match package.json');

[
	'README.md',
	'package/README.md',
	'CHANGELOG.md',
	'RELEASE_CHECKLIST.md',
	'RESPONSE_API.md',
	'docs/api/README.md',
	'docs/demo/README.md',
	'docs/en/README.md',
	'docs/recipes/README.md',
	'demos/index.html',
	'demos/main.js',
	'demos/styles.css',
].forEach(assertFile);

const rootReadme = read('README.md');
const packageReadme = read('package/README.md');
const englishReadme = read('docs/en/README.md');
const changelog = read('CHANGELOG.md');
const releaseChecklist = read('RELEASE_CHECKLIST.md');
const demoHtml = read('demos/index.html');
const demoJs = read('demos/main.js');

assert(packageReadme === rootReadme, 'package/README.md must be synchronized with README.md');
assert(changelog.includes(`## ${version} - `), `CHANGELOG.md must include a ${version} release section`);
assert(releaseChecklist.includes(`form-father@${version}`), 'RELEASE_CHECKLIST.md must reference the current npm version');
assert(releaseChecklist.includes(`v${version}`), 'RELEASE_CHECKLIST.md must reference the current git tag');

['docs/api/README.md', 'docs/demo/README.md', 'docs/recipes/README.md', 'CHANGELOG.md'].forEach(link => {
	assert(rootReadme.includes(link), `README.md must link to ${link}`);
	assert(englishReadme.includes(link), `docs/en/README.md must link to ${link}`);
});

['docs', 'demos', 'CHANGELOG.md'].forEach(fileEntry => {
	assert(packageJson.files?.includes(fileEntry), `package.json files must include ${fileEntry}`);
});

const summaryCount = (demoHtml.match(/data-form-father-summary/g) || []).length;
assert(summaryCount >= 5, 'demos/index.html must include summaries for all demo forms');
assert(demoHtml.includes('data-demo="api"'), 'demos/index.html must include the public API playground');
assert(demoJs.includes('Form.initAll'), 'demos/main.js must initialize forms through Form.initAll()');
assert(demoJs.includes('setValues') && demoJs.includes('validateField') && demoJs.includes('setErrors'), 'demos/main.js must exercise public API methods');

console.log(`Docs check passed for ${packageJson.name}@${version}`);
