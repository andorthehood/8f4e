import { BLOCK_TYPE } from './types';
import { ErrorCode, getError } from './errors';
import { areAllOperandsFloats, areAllOperandsIntegers } from './utils/operandTypes';
import {
	isInstructionInsideFunction,
	isInstructionInsideModuleOrFunction,
	isInstructionIsInsideAModule,
	isInstructionIsInsideBlock,
} from './utils/blockStack';

import type { BlockStack, CompilationContext, InstructionCompiler, StackItem } from './types';

export type OperandRule = 'int' | 'float' | 'matching';
export type ScopeRule = 'module' | 'function' | 'moduleOrFunction' | 'block' | 'constants' | 'map';

export interface ValidationSpec {
	scope?: ScopeRule;
	minOperands?: number;
	minArguments?: number;
	operandTypes?: OperandRule[] | OperandRule;
	onInsufficientOperands?: ErrorCode;
	onInvalidScope?: ErrorCode;
	allowedInConstantsBlocks?: boolean;
	allowedInMapBlocks?: boolean;
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
		case 'block':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.BLOCK);
			break;
		case 'constants':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.CONSTANTS);
			break;
		case 'map':
			isValid = isInstructionIsInsideBlock(blockStack, BLOCK_TYPE.MAP);
			break;
	}

	if (!isValid) {
		throw getError(errorCode, line, context);
	}
}

function peekStackOperands(stack: StackItem[], count: number): StackItem[] {
	if (stack.length < count) {
		return [];
	}
	const operands: StackItem[] = [];
	const startIndex = stack.length - count;
	for (let i = 0; i < count; i++) {
		operands.push(stack[startIndex + i]);
	}
	return operands;
}

function inferErrorCodeFromRule(rule: OperandRule | OperandRule[]): ErrorCode {
	if (Array.isArray(rule)) {
		return ErrorCode.TYPE_MISMATCH;
	} else if (rule === 'int') {
		return ErrorCode.ONLY_INTEGERS;
	} else if (rule === 'float') {
		return ErrorCode.ONLY_FLOATS;
	} else if (rule === 'matching') {
		return ErrorCode.UNMATCHING_OPERANDS;
	}
	// This should never be reached
	throw new Error(`Unexpected operand rule: ${rule}`);
}

function validateOperandTypes(
	operands: StackItem[],
	rule: OperandRule | OperandRule[],
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext
): void {
	const errorCode = inferErrorCodeFromRule(rule);

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
		// Check if instruction is allowed in constants blocks (defaults to false)
		const insideConstantsBlock = isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.CONSTANTS);
		if (insideConstantsBlock && !spec.allowedInConstantsBlocks) {
			throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
		}

		// Check if instruction is allowed in map blocks (defaults to false)
		const insideMapBlock = isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.MAP);
		if (insideMapBlock && !spec.allowedInMapBlocks) {
			throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
		}

		if (spec.scope) {
			validateScope(
				context.blockStack,
				spec.scope,
				line,
				context,
				spec.onInvalidScope ?? ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK
			);
		}

		if (spec.minArguments !== undefined && line.arguments.length < spec.minArguments) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const operandsNeeded = spec.minOperands ?? 0;

		if (operandsNeeded > 0) {
			const operands = peekStackOperands(context.stack, operandsNeeded);

			if (operands.length < operandsNeeded) {
				throw getError(spec.onInsufficientOperands ?? ErrorCode.INSUFFICIENT_OPERANDS, line, context);
			}

			if (spec.operandTypes) {
				validateOperandTypes(operands, spec.operandTypes, line, context);
			}
		}

		return compiler(line, context);
	};
}
