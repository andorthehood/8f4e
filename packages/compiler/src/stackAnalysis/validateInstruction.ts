import type { CompilationContext, CompilerASTLine, InstructionSpec } from '@8f4e/compiler-spec';
import { ErrorCode, getInstructionSpec } from '@8f4e/compiler-spec';
import { getError } from '../compilerError';
import { peekStackOperands } from './peekStackOperands';
import { validateOperandTypes } from './validateOperandTypes';

/** Validates stack operand count and type requirements declared by the instruction spec. */
export function validateInstruction(line: CompilerASTLine, context: CompilationContext) {
	const spec = getInstructionSpec(line.instruction) as InstructionSpec;

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
