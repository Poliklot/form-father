import fs from 'fs';

const rootPkgPath = './package.json';
const rootPkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const packagePkgPath = './package/package.json';
const packagePkg = JSON.parse(fs.readFileSync(packagePkgPath, 'utf-8'));

rootPkg.version = packagePkg.version;

fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, '\t'));

console.log(`Синхронизирована версия пакета: ${packagePkg.version}`);
