// Root ESLint configuration for the 8f4e workspace
// Uses shared configuration from @8f4e/config/eslint
//
// Note: This file uses the shared values directly since .eslintrc.js is CommonJS
// and @8f4e/config is ESM. The values below match @8f4e/config/eslint exports.

// Shared Prettier options - matches @8f4e/config/eslint prettierOptions
const prettierOptions = {
	arrowParens: 'avoid',
	bracketSpacing: true,
	printWidth: 120,
	quoteProps: 'as-needed',
	semi: true,
	singleQuote: true,
	trailingComma: 'es5',
	useTabs: true,
};

// Shared import order rule - matches @8f4e/config/eslint importOrderRule
const importOrderRule = [
	'error',
	{
		groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index', 'object', 'type'],
		'newlines-between': 'always',
	},
];

module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
	},
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'prettier', 'import'],
	root: true,
	rules: {
		'@typescript-eslint/ban-ts-comment': 'warn',
		'import/order': importOrderRule,
		'prettier/prettier': ['error', prettierOptions],
	},
};
