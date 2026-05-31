import type { CompilerASTLine, InstructionCompiler, MemoryAddressRange, StackItem } from '@8f4e/compiler-spec';
import { requireStackAddress } from '../utils/stackItem';
import {
	clampAddressByteCode,
	getClampAccessByteWidth,
	getModuleAddressRange,
	rangeUpperByteAddressCode,
} from './utils/addressClamp';
import { linearLastValidStartAddress } from './utils/memoryAccessGuard';
import { saveByteCode } from './utils/saveByteCode';

function clampToRange(
	line: CompilerASTLine,
	context: Parameters<InstructionCompiler>[1],
	operand: StackItem,
	range: MemoryAddressRange
) {
	const accessByteWidth = getClampAccessByteWidth(line);
	return saveByteCode(
		context,
		clampAddressByteCode(context, line, range.byteAddress, rangeUpperByteAddressCode(range, accessByteWidth))
	);
}

export const clampAddress: InstructionCompiler = (line, context) => {
	const [rawOperand] = line.stackAnalysis.consumedOperands;
	const operand = requireStackAddress(rawOperand, line, context);
	const range = operand.address.clampRange ?? operand.address.safeRange;

	return clampToRange(line, context, operand, range!);
};

export const clampModuleAddress: InstructionCompiler = (line, context) => {
	const [rawOperand] = line.stackAnalysis.consumedOperands;
	const operand = requireStackAddress(rawOperand, line, context);
	return clampToRange(line, context, operand, getModuleAddressRange(context));
};

export const clampGlobalAddress: InstructionCompiler = (line, context) => {
	const [rawOperand] = line.stackAnalysis.consumedOperands;
	const operand = requireStackAddress(rawOperand, line, context);
	const accessByteWidth = getClampAccessByteWidth(line);

	return saveByteCode(
		context,
		clampAddressByteCode(context, line, 0, linearLastValidStartAddress(accessByteWidth, operand.address.memoryIndex))
	);
};
