import { f32const, f64const, WASM_F32_EQ, WASM_F64_EQ, WASM_I32_EQZ } from '@8f4e/compiler-wasm-utils';
import { isStackFloat64, isStackInteger } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `equalToZero`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const equalToZero: InstructionCompiler = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;

	if (isStackInteger(operand)) {
		return saveByteCode(context, [WASM_I32_EQZ]);
	} else if (isStackFloat64(operand)) {
		return saveByteCode(context, [...f64const(0), WASM_F64_EQ]);
	} else {
		return saveByteCode(context, [...f32const(0), WASM_F32_EQ]);
	}
};

export default equalToZero;
