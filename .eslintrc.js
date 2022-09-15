module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'prettier'],
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
	},
	env: {
		browser: true,
		es2021: true,
		commonjs: true,
	},
};
