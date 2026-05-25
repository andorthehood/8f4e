import { f32store, f64store, i32store } from '@8f4e/compiler-wasm-utils';
import {
	DOUBLE_WORD_MEMORY_ACCESS_WIDTH,
	ErrorCode,
	WASM_MEMORY_PAGE_SIZE,
	WORD_MEMORY_ACCESS_WIDTH,
} from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { guardedStore, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { getAddressMemoryIndex } from './utils/memoryAccessTarget';

import { getError } from '../compilerError';
import { getPointeeElementWordSizeFromMetadata } from '../utils/memoryData';

import type { CodegenContext, DataStructure, InstructionCompiler, StackItem } from '@8f4e/compiler-spec';

function getRequiredMemoryByteLength(context: CodegenContext, memoryIndex: number): number {
	const currentModuleRequiredBytes = Object.values(context.namespace.memory)
		.filter(item => (item.memoryIndex ?? 0) === memoryIndex)
		.map(item => item.byteAddress + item.wordAlignedSize * WORD_MEMORY_ACCESS_WIDTH);
	const collectedModuleRequiredBytes = Object.values(context.namespace.namespaces)
		.filter(namespace => namespace.kind === 'module' && (namespace.memoryIndex ?? 0) === memoryIndex)
		.map(namespace => (namespace.byteAddress ?? 0) + (namespace.wordAlignedSize ?? 0) * WORD_MEMORY_ACCESS_WIDTH);

	return Math.max(WASM_MEMORY_PAGE_SIZE, ...currentModuleRequiredBytes, ...collectedModuleRequiredBytes);
}

function isKnownAddressInBounds(address: number, accessByteWidth: number, memoryByteLength: number): boolean {
	return Number.isInteger(address) && address >= 0 && address <= memoryByteLength - accessByteWidth;
}

function getPointerSlotValueAccess(destination: StackItem, context: CodegenContext): DataStructure | undefined {
	const range = destination.address?.safeRange;
	const memoryId = range?.memoryId;
	if (!memoryId) {
		return undefined;
	}

	const memoryItem = range.moduleId
		? context.namespace.namespaces[range.moduleId]?.memory?.[memoryId]
		: context.namespace.memory[memoryId];

	return memoryItem?.pointeeBaseType ? memoryItem : undefined;
}

/**
 * Instruction compiler for `store`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const store: InstructionCompiler = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const [operand2Address, operand1Value] = line.stackAnalysis.consumedOperands;
	const memoryIndex = getAddressMemoryIndex(operand2Address);
	const instructions = operand1Value.isInteger
		? i32store(undefined, undefined, 2, 0, memoryIndex)
		: operand1Value.isFloat64
			? f64store(undefined, undefined, 3, 0, memoryIndex)
			: f32store(undefined, undefined, 2, 0, memoryIndex);
	const accessByteWidth = operand1Value.isFloat64 ? DOUBLE_WORD_MEMORY_ACCESS_WIDTH : WORD_MEMORY_ACCESS_WIDTH;
	const pointerSlot = getPointerSlotValueAccess(operand2Address, context);
	const pointerValueAccessByteWidth = pointerSlot ? getPointeeElementWordSizeFromMetadata(pointerSlot) : undefined;
	const shouldGuardPointerValue =
		pointerValueAccessByteWidth !== undefined &&
		operand1Value.knownIntegerValue === undefined &&
		!isSafeMemoryAccess(operand1Value, pointerValueAccessByteWidth);

	if (pointerValueAccessByteWidth !== undefined && operand1Value.knownIntegerValue !== undefined) {
		const memoryByteLength = getRequiredMemoryByteLength(context, pointerSlot?.pointeeMemoryIndex ?? 0);
		if (!isKnownAddressInBounds(operand1Value.knownIntegerValue, pointerValueAccessByteWidth, memoryByteLength)) {
			throw getError(ErrorCode.INVALID_POINTER_ADDRESS, line, context);
		}
	}

	if (isSafeMemoryAccess(operand2Address, accessByteWidth) && !shouldGuardPointerValue) {
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
			...(shouldGuardPointerValue
				? {
						storedAddressAccessByteWidth: pointerValueAccessByteWidth,
						storedAddressMemoryIndex: pointerSlot?.pointeeMemoryIndex,
					}
				: {}),
		})
	);
};

export default store;
