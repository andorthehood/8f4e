import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';

/**
 * Instruction compiler for `greaterOrEqual`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const greaterOrEqual = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_GE_S,
		float32: WASMInstruction.F32_GE,
		float64: WASMInstruction.F64_GE,
	},
	result: 'comparison',
});

export default greaterOrEqual;
