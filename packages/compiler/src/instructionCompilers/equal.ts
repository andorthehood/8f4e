import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';

/**
 * Instruction compiler for `equal`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const equal = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_EQ,
		float32: WASMInstruction.F32_EQ,
		float64: WASMInstruction.F64_EQ,
	},
	result: 'comparison',
});

export default equal;
