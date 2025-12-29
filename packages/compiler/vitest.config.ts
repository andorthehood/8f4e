import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		include: [
			'tests/**/*.test.ts',
			'src/wasmUtils/ieee754.ts',
			'src/wasmUtils/unsignedLEB128.ts',
			'src/wasmUtils/signedLEB128.ts',
			'src/wasmUtils/encodeString.ts',
			'src/wasmUtils/createVector.ts',
			'src/wasmUtils/localGet.ts',
			'src/wasmUtils/localSet.ts',
			'src/wasmUtils/call.ts',
			'src/wasmUtils/i32const.ts',
			'src/wasmUtils/f32const.ts',
			'src/wasmUtils/i32store.ts',
			'src/wasmUtils/f32store.ts',
			'src/wasmUtils/loadInstructions.ts',
			'src/wasmUtils/controlFlowInstructions.ts',
			'src/wasmUtils/typeFunctionSections.ts',
			'src/wasmUtils/exportSection.ts',
			'src/wasmUtils/codeSection.ts',
			'src/wasmUtils/memorySection.ts',
			'src/wasmUtils/importSection.ts',
			'src/wasmUtils/nameSection.ts',
		],
		additionalExclude: ['**/testUtils.ts', '**/__fixtures__/**'],
		typecheckEnabled: true,
	})
);
