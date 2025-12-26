import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import { BLOCK_TYPE, ArgumentType } from './types';
import { ErrorCode, getError } from './errors';

import type { BlockStack, CompilationContext, MemoryMap, StackItem, Argument } from './types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}

export function isMemoryReferenceIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return (
		(name.startsWith('&') && Object.hasOwn(memoryMap, name.substring(1))) ||
		(name.endsWith('&') && Object.hasOwn(memoryMap, name.slice(0, -1)))
	);
}

export function isMemoryPointerIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('*') && Object.hasOwn(memoryMap, name.substring(1));
}

export function isElementCountIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('$') && Object.hasOwn(memoryMap, name.substring(1));
}

export function isElementWordSizeIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('%') && Object.hasOwn(memoryMap, name.substring(1));
}

export function getDataStructure(memoryMap: MemoryMap, id: string) {
	return memoryMap[id];
}

export function getDataStructureByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress : 0;
}

export function getMemoryStringLastByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY : 0;
}

export function getElementCount(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.numberOfElements : 0;
}

export function getElementWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}

export function isInstructionIsInsideAModule(blockStack: BlockStack) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === BLOCK_TYPE.MODULE) {
			return true;
		}
	}
	return false;
}

export function isInstructionInsideFunction(blockStack: BlockStack) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === BLOCK_TYPE.FUNCTION) {
			return true;
		}
	}
	return false;
}

export function isInstructionInsideModuleOrFunction(blockStack: BlockStack) {
	return isInstructionIsInsideAModule(blockStack) || isInstructionInsideFunction(blockStack);
}

export function isInstructionIsInsideBlock(blockStack: BlockStack, blockType: BLOCK_TYPE) {
	for (let i = blockStack.length - 1; i >= 0; i--) {
		if (blockStack[i].blockType === blockType) {
			return true;
		}
	}
	return false;
}

export function calculateWordAlignedSizeOfMemory(memory: MemoryMap): number {
	return Object.values(memory).reduce((accumulator, current) => {
		return accumulator + current.wordAlignedSize;
	}, 0);
}

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return !operands.some(operand => !operand.isInteger);
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return !operands.some(operand => operand.isInteger);
}

export function saveByteCode(context: CompilationContext, byteCode: number[]): CompilationContext {
	if (isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.INIT)) {
		context.initSegmentByteCode.push(...byteCode);
	} else {
		context.loopSegmentByteCode.push(...byteCode);
	}
	return context;
}

export function parseMemoryInstructionArguments(
	args: Array<Argument>,
	lineNumber: number,
	instruction: string,
	context: CompilationContext
): { id: string; defaultValue: number } {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const lineForError = { lineNumber, instruction, arguments: args } as any;

	if (!args[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, lineForError, context);
	}

	let defaultValue = 0;
	let id = '';

	if (args[0]?.type === ArgumentType.LITERAL) {
		defaultValue = args[0].value;
		id = '__anonymous__' + lineNumber;
	} else if (args[0]?.type === ArgumentType.IDENTIFIER) {
		const constant = context.namespace.consts[args[0].value];

		if (constant) {
			defaultValue = constant.value;
			id = '__anonymous__' + lineNumber;
		} else {
			id = args[0].value;
		}
	}

	if (args[1]?.type === ArgumentType.LITERAL) {
		defaultValue = args[1].value;
	} else if (args[1]?.type === ArgumentType.IDENTIFIER && /&(\S+)\.(\S+)/.test(args[1].value)) {
		// Intermodular references are resolved later
	} else if (args[1]?.type === ArgumentType.IDENTIFIER && args[1].value[0] === '&') {
		const memoryItem = context.namespace.memory[args[1].value.substring(1)];

		if (!memoryItem) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
		}

		defaultValue = memoryItem.byteAddress;
	} else if (args[1]?.type === ArgumentType.IDENTIFIER && args[1].value[0] === '$') {
		const memoryItem = context.namespace.memory[args[1].value.substring(1)];

		if (!memoryItem) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
		}

		defaultValue = memoryItem.wordAlignedSize;
	} else if (args[1]?.type === ArgumentType.IDENTIFIER) {
		const constant = context.namespace.consts[args[1].value];

		if (!constant) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
		}

		defaultValue = constant.value;
	}

	return { id, defaultValue };
}

export function getPointerDepth(instruction: string): number {
	const matches = instruction.match(/\*+$/);
	return matches ? matches[0].length : 0;
}

export function getMemoryFlags(baseType: 'int' | 'float', pointerDepth: number) {
	const isPointer = pointerDepth > 0;
	const isPointingToInteger = isPointer && baseType === 'int';
	const isPointingToPointer = pointerDepth === 2;
	const isInteger = baseType === 'int' || isPointer;

	return {
		isPointer,
		isPointingToInteger,
		isPointingToPointer,
		isInteger,
	};
}
