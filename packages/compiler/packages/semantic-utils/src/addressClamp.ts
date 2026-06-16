import type {
	CodegenContext,
	CompilationContext,
	CompilerASTLine,
	MemoryAddressRange,
	StackItem,
} from '@8f4e/language-spec';
import { ArgumentType, getMemoryRegionFields, WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/language-spec';

const DEFAULT_ACCESS_BYTE_WIDTH = WORD_MEMORY_ACCESS_WIDTH;

/**
 * Resolves the byte width protected by a clamp instruction, defaulting to one word.
 *
 * @param line - AST line being processed.
 * @returns The resolved numeric value.
 */
export function getClampAccessByteWidth(line: CompilerASTLine): number {
	const argument = line.arguments[0];
	return argument?.type === ArgumentType.LITERAL ? argument.value : DEFAULT_ACCESS_BYTE_WIDTH;
}

/**
 * Builds the safe address range for the current module memory allocation.
 *
 * @param context - Compilation context used by the operation.
 * @returns The resolved memory address range.
 */
export function getModuleAddressRange(context: CodegenContext | CompilationContext): MemoryAddressRange {
	return {
		source: 'module-start',
		...getMemoryRegionFields(context.currentMemoryIndex, context.currentMemoryRegionName),
		byteAddress: context.startingByteAddress,
		safeByteLength: Math.max(0, context.currentModuleWordAlignedSize * WORD_MEMORY_ACCESS_WIDTH),
		...(context.namespace.moduleName ? { moduleId: context.namespace.moduleName } : {}),
	};
}

function clampKnownIntegerValue(value: number | undefined, lower: number, upper: number): number | undefined {
	return value === undefined ? undefined : Math.min(Math.max(value, lower), upper);
}

/**
 * Converts a stack operand into the address item produced after applying an optional clamp range.
 *
 * @param operand - Stack item to convert or clamp.
 * @param range - Optional safe memory range to preserve on the produced address.
 * @param accessByteWidth - Byte width of the memory access being protected.
 * @returns The relevant stack items for the analysis step.
 */
export function getClampedAddressStackItem(
	operand: StackItem,
	range: MemoryAddressRange | undefined,
	accessByteWidth: number
): StackItem {
	const safeAccessByteWidth = Math.min(accessByteWidth, range?.safeByteLength ?? accessByteWidth);
	const memoryIndex = range?.memoryIndex ?? (operand.kind === 'address' ? operand.address.memoryIndex : 0);
	const memoryRegionName =
		range?.memoryRegionName ?? (operand.kind === 'address' ? operand.address.memoryRegionName : undefined);
	const knownIntegerValue = range
		? clampKnownIntegerValue(
				operand.knownIntegerValue,
				range.byteAddress,
				range.byteAddress + Math.max(0, range.safeByteLength - accessByteWidth)
			)
		: undefined;

	return {
		kind: 'address',
		valueType: 'int',
		isNonZero: knownIntegerValue !== undefined ? knownIntegerValue !== 0 : false,
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(operand.kind === 'address' && operand.pointsTo ? { pointsTo: { ...operand.pointsTo } } : {}),
		address: {
			...getMemoryRegionFields(memoryIndex, memoryRegionName),
			...(range ? { clampRange: range } : {}),
			...(safeAccessByteWidth > 0 ? { safeAccessByteWidth } : {}),
		},
	};
}
