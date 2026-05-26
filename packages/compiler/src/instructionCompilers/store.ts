import { f32store, f64store, i32store } from '@8f4e/compiler-wasm-utils';
import { DOUBLE_WORD_MEMORY_ACCESS_WIDTH, WORD_MEMORY_ACCESS_WIDTH, getInstructionSpec } from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { guardedStore, isSafeMemoryAccess } from './utils/memoryAccessGuard';

import type { ASTLineBase, InstructionCompiler } from '@8f4e/compiler-spec';

type StoreLine = ASTLineBase<'store', []>;

/**
 * Instruction compiler for `store`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const store: InstructionCompiler<StoreLine> = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const operand2Address = line.stackAnalysis.consumedOperands[operation.addressOperandIndex];
	const operand1Value = line.stackAnalysis.consumedOperands[operation.valueOperandIndex];
	const memoryIndex = operand2Address.address?.memoryIndex ?? 0;
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
