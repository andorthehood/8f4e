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
				// AudioWorklet globals (runtime values available in AudioWorkletProcessor context)
				sampleRate: 'readonly',
				currentTime: 'readonly',
				currentFrame: 'readonly',
				// File System Access API types - these are TypeScript type interfaces from the DOM lib
				// that ESLint's no-undef rule doesn't recognize. Added here to satisfy ESLint while
				// TypeScript provides the actual type checking.
				FileSystemFileHandle: 'readonly',
				FileSystemDirectoryHandle: 'readonly',
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
			'import/prefer-default-export': 'error',
			'prettier/prettier': ['error', prettierOptions],
		},
	},
];
