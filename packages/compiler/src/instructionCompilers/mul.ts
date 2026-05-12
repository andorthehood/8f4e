import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import createNumericBinaryCompiler from './utils/createNumericBinaryCompiler';
import { deriveKnownIntegerValue } from './utils/knownIntegerValue';

/**
 * Instruction compiler for `mul`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const mul = createNumericBinaryCompiler({
	opcodes: {
		int32: WASMInstruction.I32_MUL,
		float32: WASMInstruction.F32_MUL,
		float64: WASMInstruction.F64_MUL,
	},
	result: 'numeric',
	deriveIntegerMetadata: (left, right) => deriveKnownIntegerValue(left, right, Math.imul),
});

export default mul;
