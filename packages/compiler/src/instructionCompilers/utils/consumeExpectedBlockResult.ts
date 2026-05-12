import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';

import type { BlockStack, InstructionCompiler } from '@8f4e/compiler-spec';

type ExpectedBlockResultOptions = {
	restore?: boolean;
	validateFloatResult?: boolean;
};

/**
 * Consumes the stack item produced for a block with a declared result type.
 *
 * Some block-closing instructions need the item restored to the logical stack after validation
 * because the WebAssembly block leaves that value available to enclosing instructions. `else`
 * validates the first branch but does not restore it because the second branch must produce its
 * own matching result.
 */
export default function consumeExpectedBlockResult(
	block: BlockStack[number],
	line: Parameters<InstructionCompiler>[0],
	context: Parameters<InstructionCompiler>[1],
	{ restore = false, validateFloatResult = false }: ExpectedBlockResultOptions = {}
) {
	if (!block.hasExpectedResult) {
		return;
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (block.expectedResultIsInteger && !operand.isInteger) {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (validateFloatResult && !block.expectedResultIsInteger && operand.isInteger) {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	if (restore) {
		context.stack.push(operand);
	}
}
