import { GLOBAL_ALIGNMENT_BOUNDARY } from '../../consts';
import { ErrorCode, getError } from '../../compilerError';
import { withValidation } from '../../withValidation';
import { alignAbsoluteWordOffset, getAbsoluteWordOffset, getByteAddressFromWordOffset } from '../layoutAddresses';
import {
	ArgumentType,
	type ArrayDeclarationLine,
	type CompilationContext,
	type InstructionCompiler,
	type MemoryTypes,
} from '../../types';

function getElementWordSize(instruction: string): number {
	if (instruction.startsWith('float64') && !instruction.includes('*')) return 8;
	if (instruction.includes('8')) return 1;
	if (instruction.includes('16')) return 2;
	return 4;
}

function createArrayDefaultValues(
	line: ArrayDeclarationLine,
	context: CompilationContext,
	numberOfElements: number,
	isInteger: boolean
) {
	const initializerArguments = line.arguments.slice(2);
	if (initializerArguments.length > numberOfElements) {
		throw getError(ErrorCode.ARRAY_INITIALIZER_TOO_LONG, line, context);
	}

	return initializerArguments.reduce<Record<string, number>>((defaults, argument, index) => {
		if (argument.type !== ArgumentType.LITERAL) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}
		defaults[index] = isInteger ? Math.trunc(argument.value) : argument.value;
		return defaults;
	}, {});
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
		const isInteger = line.instruction.startsWith('int') || line.instruction.includes('*');

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
			default: createArrayDefaultValues(line, context, numberOfElements, isInteger),
			isInteger,
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
