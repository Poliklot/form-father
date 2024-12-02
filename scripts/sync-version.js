import fs from 'fs';

const rootPkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const packagePkgPath = './package/package.json';
const packagePkg = JSON.parse(fs.readFileSync(packagePkgPath, 'utf-8'));

rootPkg.version = packagePkg.version;

fs.writeFileSync(packagePkgPath, JSON.stringify(packagePkg, null, '\t'));

console.log(`Синхронизирована версия пакета: ${packagePkg.version}`);
