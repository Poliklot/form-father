import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';

const isDemos = process.env.BUILD_TARGET === 'demos';

export default {
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
			exports: 'named',
			sourcemap: true,
			plugins: [terser()],
		},
	],
	plugins: [
		del({ targets: 'dist/*' }),
		esbuild({
			tsconfig: 'tsconfig.json',
			target: 'es2018',
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
};
