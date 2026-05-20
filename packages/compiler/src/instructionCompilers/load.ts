import { i32load, i32load16s, i32load16u, i32load8s, i32load8u, WASM_TYPE_I32 } from '@8f4e/compiler-wasm-utils';
import { BYTE_MEMORY_ACCESS_WIDTH, HALF_WORD_MEMORY_ACCESS_WIDTH, WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { guardedLoad, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { getAddressMemoryIndex } from './utils/memoryAccessTarget';

import { getError } from '../compilerError';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `load` variants.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const instructionToByteCodeMap: Record<string, (memoryIndex: number) => number[]> = {
	load: memoryIndex => i32load(2, 0, memoryIndex),
	load8s: memoryIndex => i32load8s(0, 0, memoryIndex),
	load8u: memoryIndex => i32load8u(0, 0, memoryIndex),
	load16s: memoryIndex => i32load16s(1, 0, memoryIndex),
	load16u: memoryIndex => i32load16u(1, 0, memoryIndex),
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
	const [address] = line.stackAnalysis.consumedOperands;
	const buildInstructions = instructionToByteCodeMap[line.instruction];
	if (!buildInstructions) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	const memoryIndex = getAddressMemoryIndex(address);
	const instructions = buildInstructions(memoryIndex);
	const accessByteWidth = instructionToAccessByteWidthMap[line.instruction];
	if (isSafeMemoryAccess(address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedLoad(context, {
			accessByteWidth,
			memoryIndex,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			resultType: WASM_TYPE_I32,
			loadByteCode: instructions,
		})
	);
};

export default load;
