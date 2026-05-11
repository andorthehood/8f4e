import { i32load, i32load16s, i32load16u, i32load8s, i32load8u, Type } from '@8f4e/compiler-wasm-utils';
import {
	BYTE_MEMORY_ACCESS_WIDTH,
	HALF_WORD_MEMORY_ACCESS_WIDTH,
	WORD_MEMORY_ACCESS_WIDTH,
} from '@8f4e/compiler-types';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { guardedLoad, isSafeMemoryAccess } from '../utils/memoryAccessGuard';

import type { InstructionCompiler } from '@8f4e/compiler-types';

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

const instructionToAccessByteWidthMap: Record<string, number> = {
	load: WORD_MEMORY_ACCESS_WIDTH,
	load8s: BYTE_MEMORY_ACCESS_WIDTH,
	load8u: BYTE_MEMORY_ACCESS_WIDTH,
	load16s: HALF_WORD_MEMORY_ACCESS_WIDTH,
	load16u: HALF_WORD_MEMORY_ACCESS_WIDTH,
};

const load: InstructionCompiler = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const address = context.stack.pop()!;
	context.stack.push({ isInteger: true, isNonZero: false });
	const instructions = instructionToByteCodeMap[line.instruction];
	if (!instructions) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	const accessByteWidth = instructionToAccessByteWidthMap[line.instruction];
	if (isSafeMemoryAccess(address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedLoad(context, {
			accessByteWidth,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			resultType: Type.I32,
			loadByteCode: instructions,
		})
	);
};

export default load;
