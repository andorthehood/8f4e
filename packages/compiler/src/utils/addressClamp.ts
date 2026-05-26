import { ArgumentType, WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/compiler-spec';

import { getMemoryRegionFields } from '../semantic/memoryRegions';

import type {
	CompilerASTLine,
	CodegenContext,
	CompilationContext,
	MemoryAddressRange,
	StackItem,
} from '@8f4e/compiler-spec';

const DEFAULT_ACCESS_BYTE_WIDTH = WORD_MEMORY_ACCESS_WIDTH;

export function getClampAccessByteWidth(line: CompilerASTLine): number {
	const argument = line.arguments[0];
	return argument?.type === ArgumentType.LITERAL ? argument.value : DEFAULT_ACCESS_BYTE_WIDTH;
}

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

export function getClampedAddressStackItem(
	operand: StackItem,
	range: MemoryAddressRange | undefined,
	accessByteWidth: number
): StackItem {
	const safeAccessByteWidth = Math.min(accessByteWidth, range?.safeByteLength ?? accessByteWidth);
	const knownIntegerValue = range
		? clampKnownIntegerValue(
				operand.knownIntegerValue,
				range.byteAddress,
				range.byteAddress + Math.max(0, range.safeByteLength - accessByteWidth)
			)
		: undefined;

	return {
		isInteger: true,
		isNonZero: knownIntegerValue !== undefined ? knownIntegerValue !== 0 : false,
		...(knownIntegerValue !== undefined ? { knownIntegerValue } : {}),
		...(range || safeAccessByteWidth > 0
			? {
					address: {
						...getMemoryRegionFields(
							range?.memoryIndex ?? operand.address?.memoryIndex ?? 0,
							range?.memoryRegionName ?? operand.address?.memoryRegionName
						),
						...(range ? { clampRange: range } : {}),
						...(safeAccessByteWidth > 0 ? { safeAccessByteWidth } : {}),
					},
				}
			: {}),
	};
}
