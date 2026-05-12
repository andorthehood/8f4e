import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';
import { deriveAddStackMetadata } from './utils/stackAddressMetadata';

/**
 * Instruction compiler for `add`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const add = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_ADD,
		float32: WASMInstruction.F32_ADD,
		float64: WASMInstruction.F64_ADD,
	},
	result: 'numeric',
	deriveIntegerMetadata: deriveAddStackMetadata,
});

export default add;
