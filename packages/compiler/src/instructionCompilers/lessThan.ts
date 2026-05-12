import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';

/**
 * Instruction compiler for `lessThan`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const lessThan = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_LT_S,
		float32: WASMInstruction.F32_LT,
		float64: WASMInstruction.F64_LT,
	},
	result: 'comparison',
});

export default lessThan;
