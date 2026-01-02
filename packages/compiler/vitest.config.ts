import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		include: [
			'tests/**/*.test.ts',
			'src/wasmUtils/**/*.ts',
			'src/astUtils/**/*.ts',
			'src/utils/**/*.ts',
			'src/instructionCompilers/**/*.ts',
			'src/syntax/**/*.ts',
		],
		additionalExclude: [
			'**/testUtils.ts',
			'**/__fixtures__/**',
			'**/type.ts',
			'**/wasmInstruction.ts',
			'**/consts.ts',
			'**/index.ts',
			'**/section.ts',
			'**/syntaxError.ts',
		],
		typecheckEnabled: true,
	})
);
