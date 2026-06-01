import type { CompilationContext, CompilerASTLine, InstructionSpec } from '@8f4e/compiler-spec';
import { ErrorCode, getInstructionSpec } from '@8f4e/compiler-spec';
import { getError } from '../compilerError';
import { peekStackOperands } from './peekStackOperands';
import { validateOperandTypes } from './validateOperandTypes';
import { validateScope } from './validateScope';

function validateInstructionContextWithSpec(line: CompilerASTLine, context: CompilationContext, spec: InstructionSpec) {
	if (context.insideConstantsBlock && !spec.allowedInConstantsBlocks) {
		throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
	}

	if (context.insideMapBlock && !spec.allowedInMapBlocks) {
		throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
	}

	if (spec.scope) {
		validateScope(spec.scope, line, context, spec.onInvalidScope ?? ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK);
	}
}

export function validateInstructionContext(line: CompilerASTLine, context: CompilationContext) {
	const spec = getInstructionSpec(line.instruction) as InstructionSpec;

	validateInstructionContextWithSpec(line, context, spec);
}

export function validateInstruction(line: CompilerASTLine, context: CompilationContext) {
	const spec = getInstructionSpec(line.instruction) as InstructionSpec;

	validateInstructionContextWithSpec(line, context, spec);

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
