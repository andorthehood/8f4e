import {
	alignAbsoluteWordOffset,
	getAbsoluteWordOffset,
	getByteAddressFromWordOffset,
	MemoryTypes,
} from '@8f4e/compiler-memory-layout';

import { GLOBAL_ALIGNMENT_BOUNDARY } from '../../consts';
import { withValidation } from '../../withValidation';

import type { ArrayDeclarationLine, InstructionCompiler } from '../../types';

function getElementWordSize(instruction: string): number {
	if (instruction.startsWith('float64') && !instruction.includes('*')) return 8;
	if (instruction.includes('8')) return 1;
	if (instruction.includes('16')) return 2;
	return 4;
}

/**
 * Instruction compiler for typed array declarations such as `int[]`, `float[]`, and `float64[]`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const array: InstructionCompiler<ArrayDeclarationLine> = withValidation<ArrayDeclarationLine>(
	{
		scope: 'module',
	},
	(line: ArrayDeclarationLine, context) => {
		const memoryId = line.arguments[0].value;
		const elementCountArg = line.arguments[1];
		const wordAlignedAddress = context.currentModuleNextWordOffset ?? 0;

		const elementWordSize = getElementWordSize(line.instruction);
		const isUnsigned = line.instruction.endsWith('u[]');
		const numberOfElements = elementCountArg.value;

		// Apply 8-byte alignment for float64[] arrays: round up absolute word offset to even
		// so byteAddress is always divisible by 8, making Float64Array / DataView access safe.
		const absoluteWordOffset = getAbsoluteWordOffset(context.startingByteAddress, wordAlignedAddress);
		const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, elementWordSize);
		const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
		const wordAlignedSize =
			alignmentPadding + Math.ceil((numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY);

		context.namespace.memory[memoryId] = {
			numberOfElements,
			elementWordSize,
			// Round up to the 4-byte allocation grid so all data structures stay word-addressable.
			// alignmentPadding reserves any gap needed before float64[] to guarantee 8-byte byte-address alignment.
			wordAlignedSize,
			// Store address in 4-byte words because pointer math/view indexing is word-based.
			wordAlignedAddress: alignedAbsoluteWordOffset,
			id: memoryId,
			// Convert the word-grid offset back to a byte address for wasm load/store instructions.
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

		return context;
	}
);

export default array;
