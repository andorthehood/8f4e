import { WASM_F32_SQRT, WASM_F64_SQRT } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `sqrt`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const sqrt: InstructionCompiler = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;

	return saveByteCode(context, [operand.valueType === 'float64' ? WASM_F64_SQRT : WASM_F32_SQRT]);
};

export default sqrt;
