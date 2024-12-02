import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';

const isDemos = process.env.BUILD_TARGET === 'demos';

export default [
	// Первое конфигурационное объект для JavaScript сборки
	{
		input: 'src/index.ts',
		output: [
			{
				file: 'dist/index.js',
				format: 'es',
				sourcemap: true,
			},
			{
				file: 'dist/FormFather.min.js',
				format: 'iife',
				name: 'FormFather',
				sourcemap: true,
				plugins: [terser()],
			},
		],
		plugins: [
			del({ targets: 'dist/*' }),
			typescript({
				tsconfig: 'tsconfig.json',
				clean: true,
				useTsconfigDeclarationDir: true, // Важно для генерации типов
			}),
			resolve(),
			json(),
			babel({
				babelHelpers: 'bundled',
				presets: ['@babel/preset-env'],
				exclude: 'node_modules/**',
			}),
			// Копируем файлы, если сборка запущена для демо
			isDemos &&
				copy({
					targets: [{ src: 'dist/*', dest: 'demos/public' }],
					hook: 'writeBundle',
				}),
		].filter(Boolean),
	},
	{
		input: 'dist/types/index.d.ts',
		output: [{ file: 'dist/index.d.ts', format: 'es' }],
		plugins: [dts()],
	},
];
