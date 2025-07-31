import type { Config } from 'jest';

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'jest-environment-jsdom', // ← можно оставить 'jsdom', но явно так понятнее
	roots: ['<rootDir>/src', '<rootDir>/__tests__'],

	moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},

	modulePathIgnorePatterns: ['<rootDir>/package/'],
	testPathIgnorePatterns: ['<rootDir>/package/'],
};

export default config;
