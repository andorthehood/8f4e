import { f32store, f64store, i32store } from '@8f4e/compiler-wasm-utils';
import type { ASTLineBase, InstructionCompiler } from '@8f4e/language-spec';
import { DOUBLE_WORD_MEMORY_ACCESS_WIDTH, getInstructionSpec, WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/language-spec';
import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { guardedStore, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { saveByteCode } from './utils/saveByteCode';
import { requireStackAddress } from './utils/stackItem';

type StoreLine = ASTLineBase<'store', []>;

/**
 * Instruction compiler for `store`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const store: InstructionCompiler<StoreLine> = (line, context, facts) => {
	assertFunctionMemoryIoAllowed(line, context);
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const operand2Address = requireStackAddress(
		facts.stackAnalysis.consumedOperands[operation.addressOperandIndex],
		line,
		context
	);
	const operand1Value = facts.stackAnalysis.consumedOperands[operation.valueOperandIndex];
	const valueIsInteger = operand1Value.valueType === 'int';
	const valueIsFloat64 = operand1Value.valueType === 'float64';
	const memoryIndex = operand2Address.address.memoryIndex;
	const instructions = valueIsInteger
		? i32store(undefined, undefined, 2, 0, memoryIndex)
		: valueIsFloat64
			? f64store(undefined, undefined, 3, 0, memoryIndex)
			: f32store(undefined, undefined, 2, 0, memoryIndex);
	const accessByteWidth = valueIsFloat64 ? DOUBLE_WORD_MEMORY_ACCESS_WIDTH : WORD_MEMORY_ACCESS_WIDTH;
	if (isSafeMemoryAccess(operand2Address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedStore(context, {
			value: operand1Value,
			accessByteWidth,
			memoryIndex,
			lineNumber: line.lineNumber,
			storeByteCode: instructions,
		})
	);
};

export default store;
