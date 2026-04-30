import { BLOCK_TYPE, type AST, type InstructionCompiler } from '@8f4e/compiler-types';

import { peekStackOperands } from './peekStackOperands';
import { validateArgumentTypes } from './validateArgumentTypes';
import { validateOperandTypes } from './validateOperandTypes';
import { validateScope } from './validateScope';

import { ErrorCode, getError } from '../compilerError';
import { isInstructionIsInsideBlock } from '../utils/blockStack';

import type { ValidationSpec } from './types';

export function withValidation<TLine extends AST[number]>(
	spec: ValidationSpec<TLine>,
	compiler: (line: TLine, context: Parameters<InstructionCompiler>[1]) => ReturnType<InstructionCompiler>
): InstructionCompiler<TLine> {
	return function (line: TLine, context: Parameters<InstructionCompiler>[1]) {
		const insideConstantsBlock = isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.CONSTANTS);
		if (insideConstantsBlock && !spec.allowedInConstantsBlocks) {
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
		}

		const insideMapBlock = isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.MAP);
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

		if (spec.minArguments !== undefined && line.arguments.length < spec.minArguments) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (spec.argumentTypes) {
			validateArgumentTypes(line.arguments, spec.argumentTypes, line, context);
		}

		const validatedOperands = spec.validateOperands?.(line as TLine, context);
		const operandsNeeded = validatedOperands?.minOperands ?? spec.minOperands ?? 0;
		const operandTypes = validatedOperands?.operandTypes ?? spec.operandTypes;

		if (operandsNeeded > 0) {
			const operands = peekStackOperands(context.stack, operandsNeeded);

			if (operands.length < operandsNeeded) {
				throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
			}

			if (operandTypes) {
				validateOperandTypes(operands, operandTypes, line, context);
			}
		}

		return compiler(line as TLine, context);
	} as InstructionCompiler<TLine>;
}
