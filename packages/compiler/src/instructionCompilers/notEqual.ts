import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';

/**
 * Instruction compiler for `notEqual`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const notEqual = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_NE,
		float32: WASMInstruction.F32_NE,
		float64: WASMInstruction.F64_NE,
	},
	result: 'comparison',
});

export default notEqual;
