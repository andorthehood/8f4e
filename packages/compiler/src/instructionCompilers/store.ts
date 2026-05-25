import { f32store, f64store, i32store } from '@8f4e/compiler-wasm-utils';
import { DOUBLE_WORD_MEMORY_ACCESS_WIDTH, WORD_MEMORY_ACCESS_WIDTH, getInstructionSpec } from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { guardedStore, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { getAddressMemoryIndex } from './utils/memoryAccessTarget';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `store`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const store: InstructionCompiler = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const operation = getInstructionSpec(line.instruction)!.analysis!.memory!;
	const operand2Address = line.stackAnalysis.consumedOperands[operation.addressOperandIndex ?? 0];
	const operand1Value = line.stackAnalysis.consumedOperands[operation.valueOperandIndex ?? 1];
	const memoryIndex = getAddressMemoryIndex(operand2Address);
	const instructions = operand1Value.isInteger
		? i32store(undefined, undefined, 2, 0, memoryIndex)
		: operand1Value.isFloat64
			? f64store(undefined, undefined, 3, 0, memoryIndex)
			: f32store(undefined, undefined, 2, 0, memoryIndex);
	const accessByteWidth = operand1Value.isFloat64 ? DOUBLE_WORD_MEMORY_ACCESS_WIDTH : WORD_MEMORY_ACCESS_WIDTH;
	if (isSafeMemoryAccess(operand2Address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedStore(context, {
			value: operand1Value,
			accessByteWidth,
			memoryIndex,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			storeByteCode: instructions,
		})
	);
};

export default store;
