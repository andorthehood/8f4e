import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { getArrayElementWordSize } from './getArrayElementWordSize';

import { alignAbsoluteWordOffset } from '../addresses/alignAbsoluteWordOffset';
import { getAbsoluteWordOffset } from '../addresses/getAbsoluteWordOffset';
import { getByteAddressFromWordOffset } from '../addresses/getByteAddressFromWordOffset';
import { getError } from '../getError';
import { ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY, MemoryTypes, type PublicMemoryLayoutContext } from '../internalTypes';

export function applyArrayDeclarationLine(line: AST[number], context: PublicMemoryLayoutContext) {
	const memoryId =
		line.arguments[0]?.type === ArgumentType.IDENTIFIER
			? line.arguments[0].value
			: `__anonymous__${line.lineNumberAfterMacroExpansion}`;
	const elementCountArg = line.arguments[1];
	if (elementCountArg?.type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: '' });
	}
	const wordAlignedAddress = context.currentModuleNextWordOffset ?? 0;

	const elementWordSize = getArrayElementWordSize(line.instruction);
	const isUnsigned = line.instruction.endsWith('u[]');
	const numberOfElements = elementCountArg.value;
	const absoluteWordOffset = getAbsoluteWordOffset(context.startingByteAddress, wordAlignedAddress);
	const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, elementWordSize);
	const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
	const wordAlignedSize =
		alignmentPadding + Math.ceil((numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY);

	context.namespace.memory[memoryId] = {
		numberOfElements,
		elementWordSize,
		wordAlignedSize,
		wordAlignedAddress: alignedAbsoluteWordOffset,
		id: memoryId,
		byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
		default: {},
		isInteger: line.instruction.startsWith('int') || line.instruction.includes('*'),
		isPointingToPointer: line.instruction.includes('**'),
		...(line.instruction.includes('*')
			? {
					pointeeBaseType: line.instruction.startsWith('float64')
						? 'float64'
						: line.instruction.startsWith('int')
							? 'int'
							: 'float',
				}
			: {}),
		type: line.instruction.slice(0, -2) as unknown as MemoryTypes,
		isUnsigned,
	};
	context.currentModuleNextWordOffset = wordAlignedAddress + wordAlignedSize;
}
