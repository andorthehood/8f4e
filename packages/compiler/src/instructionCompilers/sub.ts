import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';
import { deriveSubStackMetadata } from './utils/stackAddressMetadata';

/**
 * Instruction compiler for `sub`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const sub = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_SUB,
		float32: WASMInstruction.F32_SUB,
		float64: WASMInstruction.F64_SUB,
	},
	result: 'numeric',
	deriveIntegerMetadata: deriveSubStackMetadata,
});

export default sub;
