module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'prettier', 'import'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	rules: {
		'@typescript-eslint/ban-ts-comment': 'warn',
		'prettier/prettier': [
			'error',
			{
				arrowParens: 'avoid',
				bracketSpacing: true,
				printWidth: 120,
				quoteProps: 'as-needed',
				semi: true,
				singleQuote: true,
				trailingComma: 'es5',
				useTabs: true,
			},
		],
		'import/order': [
			'error',
			{
				groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index', 'object', 'type'],
				'newlines-between': 'always',
			},
		],
	},
	env: {
		browser: true,
		es2021: true,
		commonjs: true,
	},
};
