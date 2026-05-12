import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';

/**
 * Instruction compiler for `lessOrEqual`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const lessOrEqual = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_LE_S,
		float32: WASMInstruction.F32_LE,
		float64: WASMInstruction.F64_LE,
	},
	result: 'comparison',
});

export default lessOrEqual;
