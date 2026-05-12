import { f32store, f64store, i32store } from '@8f4e/compiler-wasm-utils';
import { DOUBLE_WORD_MEMORY_ACCESS_WIDTH, WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { guardedStore, isSafeMemoryAccess } from './utils/memoryAccessGuard';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `store`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const store: InstructionCompiler = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const operand1Value = context.stack.pop()!;
	const operand2Address = context.stack.pop()!;
	const instructions = operand1Value.isInteger ? i32store() : operand1Value.isFloat64 ? f64store() : f32store();
	const accessByteWidth = operand1Value.isFloat64 ? DOUBLE_WORD_MEMORY_ACCESS_WIDTH : WORD_MEMORY_ACCESS_WIDTH;
	if (isSafeMemoryAccess(operand2Address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedStore(context, {
			value: operand1Value,
			accessByteWidth,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			storeByteCode: instructions,
		})
	);
};

export default store;
