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
		'import/order': [
			'error',
			{
				groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index', 'object', 'type'],
				'newlines-between': 'always',
			},
		],
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
		'sort-imports': [
			'warn',
			{
				allowSeparatedGroups: true,
				ignoreCase: false,
				ignoreDeclarationSort: false,
				ignoreMemberSort: false,
				memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
			},
		],

		'sort-keys': ['warn', 'asc', { caseSensitive: true, natural: false }],
	},
};
