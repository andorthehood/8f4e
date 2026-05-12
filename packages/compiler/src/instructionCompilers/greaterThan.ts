import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';

/**
 * Instruction compiler for `greaterThan`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const greaterThan = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_GT_S,
		float32: WASMInstruction.F32_GT,
		float64: WASMInstruction.F64_GT,
	},
	result: 'comparison',
});

export default greaterThan;
