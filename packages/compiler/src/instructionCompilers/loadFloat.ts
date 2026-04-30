import { f32load } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `loadFloat`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const loadFloat: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		assertFunctionMemoryIoAllowed(line, context);
		context.stack.pop();
		context.stack.push({ isInteger: false, isNonZero: false });
		return saveByteCode(context, f32load());
	}
);

export default loadFloat;
