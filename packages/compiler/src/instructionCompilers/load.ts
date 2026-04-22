import { i32load, i32load16s, i32load16u, i32load8s, i32load8u } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `load` variants.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const instructionToByteCodeMap: Record<string, number[]> = {
	load: i32load(),
	load8s: i32load8s(),
	load8u: i32load8u(),
	load16s: i32load16s(),
	load16u: i32load16u(),
};

const load: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		assertFunctionMemoryIoAllowed(line, context);
		context.stack.pop();
		context.stack.push({ isInteger: true, isNonZero: false });
		const instructions = instructionToByteCodeMap[line.instruction];
		if (!instructions) {
			throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
		}
		return saveByteCode(context, instructions);
	}
);

export default load;
