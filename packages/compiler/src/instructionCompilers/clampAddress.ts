import { ErrorCode } from '@8f4e/compiler-spec';

import {
	clampAddressByteCode,
	getClampAccessByteWidth,
	getClampedAddressStackItem,
	getModuleAddressRange,
	linearUpperByteAddressCode,
	rangeUpperByteAddressCode,
} from './utils/addressClamp';
import { saveByteCode } from './utils/saveByteCode';

import { getError } from '../compilerError';

import type { AST, InstructionCompiler, MemoryAddressRange, StackItem } from '@8f4e/compiler-spec';

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

export const clampAddress: InstructionCompiler = (line, context) => {
	const operand = context.stack.pop()!;
	const range = operand.address?.clampRange ?? operand.address?.safeRange;
	if (!range) {
		throw getError(ErrorCode.ADDRESS_RANGE_REQUIRED, line, context);
	}

	return clampToRange(line, context, operand, range);
};

export const clampModuleAddress: InstructionCompiler = (line, context) => {
	const operand = context.stack.pop()!;
	return clampToRange(line, context, operand, getModuleAddressRange(context));
};

export const clampGlobalAddress: InstructionCompiler = (line, context) => {
	const operand = context.stack.pop()!;
	const accessByteWidth = getClampAccessByteWidth(line);
	context.stack.push(getClampedAddressStackItem(operand, undefined, accessByteWidth));

	return saveByteCode(context, clampAddressByteCode(context, line, 0, linearUpperByteAddressCode(accessByteWidth)));
};
