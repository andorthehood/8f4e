import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		include: ['tests/**/*.test.ts', 'src/wasmUtils/**/*.ts', 'src/astUtils/**/*.ts'],
		additionalExclude: [
			'**/testUtils.ts',
			'**/__fixtures__/**',
			'**/instructionHelpers.ts',
			'**/sectionHelpers.ts',
			'**/typeHelpers.ts',
			'**/type.ts',
			'**/section.ts',
			'**/wasmInstruction.ts',
			'**/consts.ts',
			'**/index.ts',
		],
		typecheckEnabled: true,
	})
);
