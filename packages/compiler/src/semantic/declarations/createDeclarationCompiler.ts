import { getPointerDepth } from '@8f4e/tokenizer';

import parseMemoryInstructionArguments from '../../utils/memoryInstructionParser';
import getMemoryFlags from '../../utils/memoryFlags';
import { withValidation } from '../../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../../consts';

import type { InstructionCompiler, MemoryTypes } from '../../types';

type BaseType = Parameters<typeof getMemoryFlags>[0];

interface DeclarationCompilerOptions {
	/** Base type string passed to `getMemoryFlags`. */
	baseType: BaseType;
	/** When true, the default value is truncated to an integer (for int/int8/int16). */
	truncate: boolean;
	/**
	 * `elementWordSize` for non-pointer (scalar) variants.
	 * Use 4 for 32-bit types and 8 for 64-bit types (float64).
	 * Pointer variants always use elementWordSize 4 regardless of this setting.
	 */
	nonPointerElementWordSize: 4 | 8;
}

/**
 * Factory that produces an `InstructionCompiler` for a scalar/pointer memory
 * declaration instruction (int, int8, int16, float, float64 and their pointer
 * variants).
 *
 * All declaration compilers share the same five-step pattern; only the base
 * type, truncation behaviour, and non-pointer element word size differ.
 */
export default function createDeclarationCompiler(options: DeclarationCompilerOptions): InstructionCompiler {
	const { baseType, truncate, nonPointerElementWordSize } = options;

	return withValidation(
		{
			scope: 'module',
		},
		(line, context) => {
			const localWordOffset = context.currentModuleNextWordOffset ?? 0;
			const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
			const pointerDepth = getPointerDepth(line.instruction);
			const flags = getMemoryFlags(baseType, pointerDepth);

			const finalDefault = truncate ? Math.trunc(defaultValue) : defaultValue;

			if (pointerDepth > 0 || nonPointerElementWordSize === 4) {
				// Pointer variants and 32-bit scalars always occupy one 4-byte word.
				const wordAlignedSize = 1;
				context.namespace.memory[id] = {
					numberOfElements: 1,
					elementWordSize: 4,
					wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset,
					wordAlignedSize,
					byteAddress: context.startingByteAddress + localWordOffset * GLOBAL_ALIGNMENT_BOUNDARY,
					id,
					default: finalDefault,
					type: line.instruction as unknown as MemoryTypes,
					...flags,
				};
				context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
			} else {
				// 64-bit scalar (nonPointerElementWordSize === 8): requires 8-byte (2-word) start
				// alignment so that byteAddress = wordAlignedAddress * 4 is always divisible by 8.
				const absoluteWordOffset = context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
				const alignedAbsoluteWordOffset = absoluteWordOffset % 2 === 0 ? absoluteWordOffset : absoluteWordOffset + 1;
				const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
				const wordAlignedSize = alignmentPadding + 2;

				context.namespace.memory[id] = {
					numberOfElements: 1,
					elementWordSize: nonPointerElementWordSize,
					wordAlignedAddress: alignedAbsoluteWordOffset,
					wordAlignedSize,
					byteAddress: alignedAbsoluteWordOffset * GLOBAL_ALIGNMENT_BOUNDARY,
					id,
					default: finalDefault,
					type: line.instruction as unknown as MemoryTypes,
					...flags,
				};
				context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
			}

			return context;
		}
	);
}
