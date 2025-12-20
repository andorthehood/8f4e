import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import { BLOCK_TYPE } from './types';
import { ErrorCode, getError } from './errors';

import type { BlockStack, CompilationContext, InstructionCompiler, MemoryMap, StackItem } from './types';

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

export type OperandRule = 'int' | 'float' | 'any' | 'matching';
export type ScopeRule = 'module' | 'function' | 'moduleOrFunction' | 'init' | 'block';

export interface ValidationSpec {
	scope?: ScopeRule;
	minOperands?: number;
	operandTypes?: OperandRule[] | OperandRule;
	onInsufficientOperands?: ErrorCode;
	onInvalidScope?: ErrorCode;
	onInvalidTypes?: ErrorCode;
}

function validateScope(
	blockStack: BlockStack,
	scope: ScopeRule,
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext,
	errorCode: ErrorCode
): void {
	let isValid = false;

	switch (scope) {
		case 'module':
			isValid = isInstructionIsInsideAModule(blockStack);
			break;
		case 'function':
			isValid = isInstructionInsideFunction(blockStack);
			break;
		case 'moduleOrFunction':
			isValid = isInstructionInsideModuleOrFunction(blockStack);
			break;
		case 'init':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.INIT);
			break;
		case 'block':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.BLOCK);
			break;
	}

	if (!isValid) {
		throw getError(errorCode, line, context);
	}
}

function validateOperandTypes(
	operands: StackItem[],
	rule: OperandRule[] | OperandRule,
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext,
	errorCode: ErrorCode
): void {
	if (Array.isArray(rule)) {
		for (let i = 0; i < rule.length && i < operands.length; i++) {
			const operand = operands[i];
			const expectedType = rule[i];

			if (expectedType === 'int' && !operand.isInteger) {
				throw getError(errorCode, line, context);
			} else if (expectedType === 'float' && operand.isInteger) {
				throw getError(errorCode, line, context);
			}
		}
	} else if (rule === 'int') {
		if (!areAllOperandsIntegers(...operands)) {
			throw getError(errorCode, line, context);
		}
	} else if (rule === 'float') {
		if (!areAllOperandsFloats(...operands)) {
			throw getError(errorCode, line, context);
		}
	} else if (rule === 'matching') {
		if (!areAllOperandsIntegers(...operands) && !areAllOperandsFloats(...operands)) {
			throw getError(errorCode, line, context);
		}
	}
}

export function withValidation(spec: ValidationSpec, compiler: InstructionCompiler): InstructionCompiler {
	return function (line, context) {
		if (spec.scope) {
			validateScope(
				context.blockStack,
				spec.scope,
				line,
				context,
				spec.onInvalidScope ?? ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK
			);
		}

		const operandsNeeded = spec.minOperands ?? 0;
		const operands: StackItem[] = [];

		for (let i = 0; i < operandsNeeded; i++) {
			const operand = context.stack.pop();
			if (!operand) {
				for (let j = operands.length - 1; j >= 0; j--) {
					context.stack.push(operands[j]);
				}
				throw getError(spec.onInsufficientOperands ?? ErrorCode.INSUFFICIENT_OPERANDS, line, context);
			}
			operands.unshift(operand);
		}

		if (spec.operandTypes && operands.length > 0) {
			validateOperandTypes(
				operands,
				spec.operandTypes,
				line,
				context,
				spec.onInvalidTypes ?? ErrorCode.UNMATCHING_OPERANDS
			);
		}

		for (let i = 0; i < operands.length; i++) {
			context.stack.push(operands[i]);
		}

		return compiler(line, context);
	};
}
