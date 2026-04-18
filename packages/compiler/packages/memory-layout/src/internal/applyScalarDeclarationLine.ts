import { getPointerDepth, type AST } from '@8f4e/tokenizer';

import { getDeclarationBaseType } from './getDeclarationBaseType';
import { getDeclarationNonPointerElementWordSize } from './getDeclarationNonPointerElementWordSize';

import { alignAbsoluteWordOffset } from '../addresses/alignAbsoluteWordOffset';
import { getAbsoluteWordOffset } from '../addresses/getAbsoluteWordOffset';
import { getByteAddressFromWordOffset } from '../addresses/getByteAddressFromWordOffset';
import { getMemoryFlags } from '../getMemoryFlags';
import { parseMemoryInstructionArguments } from '../parseMemoryInstructionArguments';
import { MemoryTypes, type PublicMemoryLayoutContext } from '../types';

export function applyScalarDeclarationLine(line: AST[number], context: PublicMemoryLayoutContext) {
	const localWordOffset = context.currentModuleNextWordOffset ?? 0;
	const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
	const pointerDepth = getPointerDepth(line.instruction);
	const baseType = getDeclarationBaseType(line.instruction);
	const flags = getMemoryFlags(baseType, pointerDepth);
	const truncate = baseType === 'int' || baseType === 'int8' || baseType === 'int16';
	const nonPointerElementWordSize = getDeclarationNonPointerElementWordSize(baseType);
	const finalDefault = truncate ? Math.trunc(defaultValue) : defaultValue;

	if (pointerDepth > 0 || nonPointerElementWordSize === 4) {
		const wordAlignedSize = 1;
		context.namespace.memory[id] = {
			numberOfElements: 1,
			elementWordSize: 4,
			wordAlignedAddress: getAbsoluteWordOffset(context.startingByteAddress, localWordOffset),
			wordAlignedSize,
			byteAddress: getByteAddressFromWordOffset(context.startingByteAddress, localWordOffset),
			id,
			default: finalDefault,
			type: line.instruction as unknown as MemoryTypes,
			...flags,
		};
		context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
		return;
	}

	const absoluteWordOffset = getAbsoluteWordOffset(context.startingByteAddress, localWordOffset);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, nonPointerElementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize = alignmentPadding + 2;

	context.namespace.memory[id] = {
		numberOfElements: 1,
		elementWordSize: nonPointerElementWordSize,
		wordAlignedAddress: alignedAbsoluteWordOffset,
		wordAlignedSize,
		byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
		id,
		default: finalDefault,
		type: line.instruction as unknown as MemoryTypes,
		...flags,
	};
	context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
}
