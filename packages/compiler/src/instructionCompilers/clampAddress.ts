import { ErrorCode, getError } from '../compilerError';
import {
	clampAddressByteCode,
	getClampAccessByteWidth,
	getClampedAddressStackItem,
	getModuleAddressRange,
	linearUpperByteAddressCode,
	rangeUpperByteAddressCode,
} from '../utils/addressClamp';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { AST, InstructionCompiler, MemoryAddressRange, StackItem } from '@8f4e/compiler-types';

function clampToRange(
	line: AST[number],
	context: Parameters<InstructionCompiler>[1],
	operand: StackItem,
	range: MemoryAddressRange
) {
	const accessByteWidth = getClampAccessByteWidth(line);
	if (range.safeByteLength < accessByteWidth) {
		throw getError(ErrorCode.ADDRESS_RANGE_TOO_SMALL, line, context);
	}

	context.stack.push(getClampedAddressStackItem(operand, range, accessByteWidth));

	return saveByteCode(
		context,
		clampAddressByteCode(context, line, range.byteAddress, rangeUpperByteAddressCode(range, accessByteWidth))
	);
}

export const clampAddress: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		argumentTypes: 'memoryAccessWidthLiteral',
	},
	(line, context) => {
		const operand = context.stack.pop()!;
		const range = operand.clampAddressRange ?? operand.safeAddressRange;
		if (!range) {
			throw getError(ErrorCode.ADDRESS_RANGE_REQUIRED, line, context);
		}

		return clampToRange(line, context, operand, range);
	}
);

export const clampModuleAddress: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
		argumentTypes: 'memoryAccessWidthLiteral',
	},
	(line, context) => {
		const operand = context.stack.pop()!;
		return clampToRange(line, context, operand, getModuleAddressRange(context));
	}
);

export const clampGlobalAddress: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		argumentTypes: 'memoryAccessWidthLiteral',
	},
	(line, context) => {
		const operand = context.stack.pop()!;
		const accessByteWidth = getClampAccessByteWidth(line);
		context.stack.push(getClampedAddressStackItem(operand, undefined, accessByteWidth));

		return saveByteCode(context, clampAddressByteCode(context, line, 0, linearUpperByteAddressCode(accessByteWidth)));
	}
);
