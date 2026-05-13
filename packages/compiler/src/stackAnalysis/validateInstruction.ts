import { BlockType, instructionSpecs } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { peekStackOperands } from './peekStackOperands';
import { validateOperandTypes } from './validateOperandTypes';
import { validateScope } from './validateScope';

import { getError } from '../compilerError';
import { isInstructionIsInsideBlock } from '../utils/blockStack';

import type { AST, CompilationContext, InstructionSpec, InstructionSpecName } from '@8f4e/compiler-spec';

function resolveInstructionSpec(line: AST[number]): InstructionSpec | undefined {
	if (line.isMemoryDeclaration) {
		return instructionSpecs.memoryDeclaration;
	}

	return instructionSpecs[line.instruction as InstructionSpecName];
}

export function validateInstruction(line: AST[number], context: CompilationContext) {
	const spec = resolveInstructionSpec(line);

	if (!spec) {
		return;
	}

	const insideConstantsBlock = isInstructionIsInsideBlock(context.blockStack, BlockType.CONSTANTS);
	if (insideConstantsBlock && !spec.allowedInConstantsBlocks) {
		throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
	}

	const insideMapBlock = isInstructionIsInsideBlock(context.blockStack, BlockType.MAP);
	if (insideMapBlock && !spec.allowedInMapBlocks) {
		throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
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

	const validatedOperands = spec.validateOperands?.(line, context);
	const operandsNeeded = validatedOperands?.minOperands ?? spec.minOperands ?? 0;
	const operandTypes = validatedOperands?.operandTypes ?? spec.operandTypes;

	if (operandsNeeded === 0) {
		return;
	}

	const operands = peekStackOperands(context.stack, operandsNeeded);

	if (operands.length < operandsNeeded) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (operandTypes) {
		validateOperandTypes(operands, operandTypes, line, context);
	}
}
