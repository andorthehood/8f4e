/**
 * @8f4e/config/eslint - Shared ESLint configuration
 *
 * This module provides shared ESLint rules and Prettier settings
 * that can be consumed by the root and per-package ESLint configs.
 */

/**
 * Shared Prettier configuration embedded in ESLint.
 * These settings match the project's Prettier preferences.
 */
export const prettierOptions = {
	arrowParens: 'avoid',
	bracketSpacing: true,
	printWidth: 120,
	quoteProps: 'as-needed',
	semi: true,
	singleQuote: true,
	trailingComma: 'es5',
	useTabs: true,
} as const;

/**
 * Shared import/order rule configuration.
 * Enforces consistent import ordering across all packages.
 */
export const importOrderRule = [
	'error',
	{
		groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index', 'object', 'type'],
		'newlines-between': 'always',
	},
] as const;

/**
 * Shared ESLint rules for the workspace.
 */
export const sharedRules = {
	'@typescript-eslint/ban-ts-comment': 'warn',
	'import/order': importOrderRule,
	'prettier/prettier': ['error', prettierOptions],
} as const;

/**
 * Shared ESLint environment settings.
 */
export const sharedEnv = {
	browser: true,
	commonjs: true,
	es2021: true,
} as const;

/**
 * Shared ESLint extends configuration.
 */
export const sharedExtends = ['eslint:recommended', 'plugin:@typescript-eslint/recommended'] as const;

/**
 * Shared ESLint plugins.
 */
export const sharedPlugins = ['@typescript-eslint', 'prettier', 'import'] as const;

/**
 * Creates a complete ESLint configuration object.
 * Can be used by the root or per-package configs.
 */
export function createEslintConfig(options: { root?: boolean } = {}) {
	return {
		env: sharedEnv,
		extends: [...sharedExtends],
		parser: '@typescript-eslint/parser',
		plugins: [...sharedPlugins],
		root: options.root ?? true,
		rules: { ...sharedRules },
	};
}
