import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkg = JSON.parse(fs.readFileSync('./package/package.json', 'utf-8'));

const newVersion = process.argv[2];
if (newVersion) {
	pkg.version = newVersion;
	fs.writeFileSync('./package/package.json', JSON.stringify(pkg, null, '\t'));
}

console.log('Сборка проекта...');
execSync('npm run build', { stdio: 'inherit' });

// Получаем путь к директории dist
const distPath = path.resolve('./dist');

// Список скопированных файлов и директорий
const copiedItems = [];

// Функция для копирования файлов и директорий
function copyRecursiveSync(src, dest) {
	const stats = fs.statSync(src);
	if (stats.isDirectory()) {
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest);
		}
		const items = fs.readdirSync(src);
		items.forEach(item => {
			copyRecursiveSync(path.join(src, item), path.join(dest, item));
		});
	} else {
		fs.copyFileSync(src, dest);
	}
	copiedItems.push(dest);
}

// Копируем содержимое dist/ в корень проекта
console.log('Копирование файлов из dist/ в package/...');
const distItems = fs.readdirSync(distPath);
distItems.forEach(item => {
	const srcPath = path.join(distPath, item);
	const destPath = path.join('./package/', item);
	copyRecursiveSync(srcPath, destPath);
});

// Сохраняем список скопированных элементов в файл
fs.writeFileSync('./copiedItems.json', JSON.stringify(copiedItems, null, '\t'));

// Публикуем пакет на npm
console.log('Публикация на npm...');
execSync('npm pack', { stdio: 'inherit', cwd: './package' });
// Если хотите опубликовать на npmjs.com, раскомментируйте следующую строку:
// execSync('npm publish', { stdio: 'inherit' });

// Удаляем скопированные файлы и директории из корня после публикации
console.log('Очистка корневой директории...');
// Читаем список скопированных элементов
const itemsToRemove = JSON.parse(fs.readFileSync('./copiedItems.json', 'utf-8'));

itemsToRemove.forEach(item => {
	if (fs.existsSync(item)) {
		const stats = fs.statSync(item);
		if (stats.isDirectory()) {
			fs.rmSync(item, { recursive: true, force: true });
		} else {
			fs.unlinkSync(item);
		}
	}
});

// Удаляем файл с списком скопированных элементов
fs.unlinkSync('./copiedItems.json');

console.log('Выпуск успешно завершен!');

if (newVersion) {
	execSync('node scripts/sync-version.js', { stdio: 'inherit' });
}
