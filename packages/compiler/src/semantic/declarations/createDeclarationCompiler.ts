import type {
	AddressMetadata,
	CompilationContext,
	DataStructure,
	MemoryDeclarationLine,
	MemoryType,
} from '@8f4e/compiler-spec';
import { getPointerDepth } from '@8f4e/tokenizer';
import { alignAbsoluteWordOffset, getAbsoluteWordOffset, getByteAddressFromWordOffset } from '../layoutAddresses';
import { getMemoryRegionFields } from '../memoryRegions';
import getMemoryFlags from '../utils/memoryFlags';
import parseMemoryInstructionArguments from '../utils/memoryInstructionParser';

/** Function signature shared by semantic memory declaration compilers. */
export type MemoryDeclarationCompiler<TLine extends MemoryDeclarationLine = MemoryDeclarationLine> = (
	line: TLine,
	context: CompilationContext
) => CompilationContext;

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

function getPointeeMemoryItem(
	safeRange: NonNullable<AddressMetadata['safeRange']>,
	context: CompilationContext
): DataStructure | undefined {
	const memoryId = safeRange.memoryId;
	if (!memoryId) {
		return undefined;
	}

	if (safeRange.moduleId) {
		const namespace = context.namespace.namespaces[safeRange.moduleId];
		return namespace?.kind === 'module' ? namespace.memory?.[memoryId] : undefined;
	}

	return context.namespace.memory[memoryId];
}

function getPointeeElementCount(
	defaultAddress: AddressMetadata | undefined,
	context: CompilationContext
): number | undefined {
	const safeRange = defaultAddress?.safeRange;
	if (!safeRange || safeRange.source !== 'memory-start') {
		return undefined;
	}

	const memoryItem = getPointeeMemoryItem(safeRange, context);
	if (!memoryItem) {
		return undefined;
	}

	const byteOffset = Math.max(0, safeRange.byteAddress - memoryItem.byteAddress);
	const byteLength = memoryItem.numberOfElements * memoryItem.elementWordSize;
	return Math.max(0, Math.floor((byteLength - byteOffset) / memoryItem.elementWordSize));
}

/**
 * Factory that produces a compiler for a scalar/pointer memory
 * declaration instruction (int, int8, int16, float, float64 and their pointer
 * variants).
 *
 * All declaration compilers share the same five-step pattern; only the base
 * type, truncation behaviour, and non-pointer element word size differ.
 *
 * @param options - Compiler options for this compilation pass.
 * @returns The computed result.
 */
export default function createDeclarationCompiler(options: DeclarationCompilerOptions): MemoryDeclarationCompiler {
	const { baseType, truncate, nonPointerElementWordSize } = options;

	return (line, context) => {
		const localWordOffset = context.currentModuleNextWordOffset;
		const { id, defaultValue, defaultAddress } = parseMemoryInstructionArguments(line, context);
		const pointerDepth = getPointerDepth(line.instruction);
		const flags = getMemoryFlags(baseType, pointerDepth);
		const memoryIndex = context.currentMemoryIndex;
		const memoryRegionName = context.currentMemoryRegionName;
		const memoryRegionFields = getMemoryRegionFields(memoryIndex, memoryRegionName);
		const pointeeElementCount = getPointeeElementCount(defaultAddress, context);
		const pointerPointeeRegion =
			pointerDepth > 0
				? {
						pointeeMemoryIndex: defaultAddress?.memoryIndex ?? 0,
						...(defaultAddress?.memoryRegionName ? { pointeeMemoryRegionName: defaultAddress.memoryRegionName } : {}),
						...(pointeeElementCount !== undefined && pointeeElementCount !== 1 ? { pointeeElementCount } : {}),
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
				lineNumber: line.lineNumber,
				default: finalDefault,
				hasExplicitDefault: line.hasExplicitMemoryDefault,
				isInherited: context.isInherited,
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
				lineNumber: line.lineNumber,
				default: finalDefault,
				hasExplicitDefault: line.hasExplicitMemoryDefault,
				isInherited: context.isInherited,
				type: line.instruction as unknown as MemoryType,
				...flags,
				...pointerPointeeRegion,
			};
			context.currentModuleNextWordOffset = localWordOffset + wordAlignedSize;
		}

		return context;
	};
}
