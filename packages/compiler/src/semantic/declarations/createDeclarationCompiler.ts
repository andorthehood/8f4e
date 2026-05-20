import { getPointerDepth } from '@8f4e/tokenizer';

import parseMemoryInstructionArguments from '../../utils/memoryInstructionParser';
import getMemoryFlags from '../../utils/memoryFlags';
import { alignAbsoluteWordOffset, getAbsoluteWordOffset, getByteAddressFromWordOffset } from '../layoutAddresses';
import { getMemoryRegionFields } from '../memoryRegions';

import type { InstructionCompiler, MemoryType } from '@8f4e/compiler-spec';

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

	return (line, context) => {
		const localWordOffset = context.currentModuleNextWordOffset ?? 0;
		const { id, defaultValue, defaultAddress } = parseMemoryInstructionArguments(line, context);
		const pointerDepth = getPointerDepth(line.instruction);
		const flags = getMemoryFlags(baseType, pointerDepth);
		const memoryIndex = context.currentMemoryIndex ?? 0;
		const memoryRegionName = context.currentMemoryRegionName;
		const memoryRegionFields = getMemoryRegionFields(memoryIndex, memoryRegionName);
		const pointerPointeeRegion =
			pointerDepth > 0
				? {
						pointeeMemoryIndex: defaultAddress?.memoryIndex ?? 0,
						...(defaultAddress?.memoryRegionName ? { pointeeMemoryRegionName: defaultAddress.memoryRegionName } : {}),
					}
				: {};

		const finalDefault = truncate ? Math.trunc(defaultValue) : defaultValue;

		if (pointerDepth > 0 || nonPointerElementWordSize === 4) {
			// Pointer variants and 32-bit scalars always occupy one 4-byte word.
			const wordAlignedSize = 1;
			context.namespace.memory[id] = {
				numberOfElements: 1,
				elementWordSize: 4,
				...memoryRegionFields,
				wordAlignedAddress: getAbsoluteWordOffset(context.startingByteAddress, localWordOffset),
				wordAlignedSize,
				byteAddress: getByteAddressFromWordOffset(context.startingByteAddress, localWordOffset),
				id,
				default: finalDefault,
				hasExplicitDefault: line.hasExplicitMemoryDefault === true,
				type: line.instruction as unknown as MemoryType,
				...flags,
				...pointerPointeeRegion,
			};
			context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
		} else {
			// 64-bit scalar (nonPointerElementWordSize === 8): requires 8-byte (2-word) start
			// alignment so that byteAddress = wordAlignedAddress * 4 is always divisible by 8.
			const absoluteWordOffset = getAbsoluteWordOffset(context.startingByteAddress, localWordOffset);
			const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, nonPointerElementWordSize);
			const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
			const wordAlignedSize = alignmentPadding + 2;

			context.namespace.memory[id] = {
				numberOfElements: 1,
				elementWordSize: nonPointerElementWordSize,
				...memoryRegionFields,
				wordAlignedAddress: alignedAbsoluteWordOffset,
				wordAlignedSize,
				byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
				id,
				default: finalDefault,
				hasExplicitDefault: line.hasExplicitMemoryDefault === true,
				type: line.instruction as unknown as MemoryType,
				...flags,
				...pointerPointeeRegion,
			};
			context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
		}

		return context;
	};
}
