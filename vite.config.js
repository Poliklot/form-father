import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	root: '.', // Корень проекта
	server: {
		fs: {
			allow: ['.'], // Разрешаем доступ к корню проекта
		},
		open: 'demos/index.html',
	},
});
