import {
	hasMemoryReferencePrefix,
	extractMemoryReferenceBase,
	isMemoryPointerIdentifier as isMemoryPointerIdentifierSyntax,
	extractMemoryPointerBase,
	hasElementCountPrefix,
	extractElementCountBase,
	hasElementWordSizePrefix,
	extractElementWordSizeBase,
	getPointerDepth as getPointerDepthFromSyntax,
	parseMemoryInstructionArgumentsShape,
	SyntaxRulesError,
} from '@8f4e/syntax-rules';

import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import { BLOCK_TYPE } from './types';
import { ErrorCode, getError } from './errors';

import type { BlockStack, CompilationContext, MemoryMap, StackItem, Argument } from './types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}

export function isMemoryReferenceIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasMemoryReferencePrefix(name) && Object.hasOwn(memoryMap, extractMemoryReferenceBase(name));
}

export function isMemoryPointer(memoryMap: MemoryMap, name: string): boolean {
	return isMemoryPointerIdentifierSyntax(name) && Object.hasOwn(memoryMap, extractMemoryPointerBase(name));
}

export function isElementCountIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasElementCountPrefix(name) && Object.hasOwn(memoryMap, extractElementCountBase(name));
}

export function isElementWordSizeIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasElementWordSizePrefix(name) && Object.hasOwn(memoryMap, extractElementWordSizeBase(name));
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

	// Use syntax-rules parser for syntax-level validation
	let parsedArgs;
	try {
		parsedArgs = parseMemoryInstructionArgumentsShape(args);
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			// Wrap syntax error as compiler error
			// Currently only MISSING_ARGUMENT can be thrown from parseMemoryInstructionArgumentsShape
			// Future syntax errors should be mapped appropriately here
			throw getError(ErrorCode.MISSING_ARGUMENT, lineForError, context);
		}
		throw error;
	}

	let defaultValue = 0;
	let id = '';

	// Process first argument
	if (parsedArgs.firstArg.type === 'literal') {
		defaultValue = parsedArgs.firstArg.value;
		id = '__anonymous__' + lineNumber;
	} else if (parsedArgs.firstArg.type === 'identifier') {
		const constant = context.namespace.consts[parsedArgs.firstArg.value];

		if (constant) {
			defaultValue = constant.value;
			id = '__anonymous__' + lineNumber;
		} else {
			id = parsedArgs.firstArg.value;
		}
	}

	// Process second argument if present
	if (parsedArgs.secondArg) {
		if (parsedArgs.secondArg.type === 'literal') {
			defaultValue = parsedArgs.secondArg.value;
		} else if (parsedArgs.secondArg.type === 'intermodular-reference') {
			// Intermodular references are resolved later
		} else if (parsedArgs.secondArg.type === 'memory-reference') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			defaultValue = memoryItem.byteAddress;
		} else if (parsedArgs.secondArg.type === 'element-count') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			defaultValue = memoryItem.wordAlignedSize;
		} else if (parsedArgs.secondArg.type === 'identifier') {
			const constant = context.namespace.consts[parsedArgs.secondArg.value];

			if (!constant) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			defaultValue = constant.value;
		}
	}

	return { id, defaultValue };
}

export function getPointerDepth(instruction: string): number {
	return getPointerDepthFromSyntax(instruction);
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
