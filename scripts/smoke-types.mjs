import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const rootDir = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

if (pkg.name !== 'form-father') {
	throw new Error(`Unexpected package name: ${pkg.name}`);
}

if (pkg.version !== '0.2.12') {
	throw new Error(`Unexpected package version: ${pkg.version}`);
}

if (pkg.repository?.url !== 'https://github.com/Poliklot/form-father') {
	throw new Error(`Unexpected repository URL: ${pkg.repository?.url}`);
}

for (const field of ['main', 'module', 'types']) {
	if (!pkg[field]) {
		throw new Error(`Missing package.json ${field}`);
	}
}

for (const filePath of [pkg.main, pkg.module, pkg.types, './dist/FormFather.min.js']) {
	if (!fs.existsSync(path.join(rootDir, filePath))) {
		throw new Error(`Missing package entrypoint: ${filePath}`);
	}
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'form-father-types-'));
const tsc = process.env.TSC_BIN;
if (!tsc) {
	console.log('TSC_BIN is not set; package metadata smoke passed');
	process.exit(0);
}

const npmEnv = { ...process.env, npm_config_cache: path.join(os.tmpdir(), 'form-father-npm-cache') };
const tgz = execFileSync('npm', ['pack', '--silent'], { cwd: rootDir, encoding: 'utf8', env: npmEnv }).trim().split('\n').at(-1);
const tarball = path.join(rootDir, tgz);

fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ type: 'module', dependencies: { 'form-father': tarball } }, null, 2));
execFileSync('npm', ['install', '--silent'], { cwd: tmpDir, stdio: 'inherit', env: npmEnv });

fs.writeFileSync(
	path.join(tmpDir, 'script.ts'),
	`import Form, { serializeFormToJSON, registerValidator } from 'form-father';\n\n` +
		`const form = document.createElement('form');\n` +
		`const instance = new Form(form, { onBeforeValidate: current => current.clearInputs() });\n` +
		`const data = serializeFormToJSON<{ phone: string; email?: string }>(form);\n` +
		`registerValidator('custom', value => value === data.phone, 'Invalid');\n` +
		`console.log(instance, data.phone);\n`
);
fs.writeFileSync(
	path.join(tmpDir, 'tsconfig.json'),
	JSON.stringify({ compilerOptions: { target: 'ES2019', module: 'ESNext', moduleResolution: 'node', strict: true, noEmit: true, lib: ['ES2019', 'DOM'] }, include: ['script.ts'] }, null, 2)
);
execFileSync(tsc, ['-p', 'tsconfig.json'], { cwd: tmpDir, stdio: 'inherit' });
console.log(`Type resolution smoke passed for ${pkg.name}@${pkg.version}`);
