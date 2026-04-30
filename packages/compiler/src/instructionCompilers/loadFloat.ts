import { f32load, Type } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';

import { WORD_MEMORY_ACCESS_WIDTH } from '../consts';
import { saveByteCode } from '../utils/compilation';
import { guardedLoad, isSafeMemoryAccess } from '../utils/memoryAccessGuard';
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
		const address = context.stack.pop()!;
		context.stack.push({ isInteger: false, isNonZero: false });
		const instructions = f32load();
		if (isSafeMemoryAccess(address, WORD_MEMORY_ACCESS_WIDTH)) {
			return saveByteCode(context, instructions);
		}

		return saveByteCode(
			context,
			guardedLoad(context, {
				accessByteWidth: WORD_MEMORY_ACCESS_WIDTH,
				lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
				resultType: Type.F32,
				loadByteCode: instructions,
			})
		);
	}
);

export default loadFloat;
