// Root ESLint configuration for the 8f4e workspace (flat config format)
// Uses shared configuration from @8f4e/config/eslint
import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

import { prettierOptions, importOrderRule } from '@8f4e/config/eslint';

export default [
	// Global ignores (replaces .eslintignore)
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.vscode/**',
			'**/jest.config.js',
			'**/jest.image.ts',
			// Ignore glugglug submodule (has its own linting config)
			'**/packages/editor/packages/glugglug/**',
		],
	},
	eslint.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2021,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.commonjs,
				// File System Access API
				FileSystemFileHandle: 'readonly',
				FileSystemDirectoryHandle: 'readonly',
				// AudioWorklet globals
				sampleRate: 'readonly',
				currentTime: 'readonly',
				currentFrame: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettierPlugin,
			import: importPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			'@typescript-eslint/ban-ts-comment': 'warn',
			'import/order': importOrderRule,
			'prettier/prettier': ['error', prettierOptions],
		},
	},
];
