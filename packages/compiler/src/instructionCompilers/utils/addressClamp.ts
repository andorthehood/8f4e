import { i32const, localGet, localSet, WASM_I32_GT_U, WASM_I32_LT_S, WASM_SELECT } from '@8f4e/compiler-wasm-utils';
import { ArgumentType } from '@8f4e/compiler-spec';
import { WORD_MEMORY_ACCESS_WIDTH } from '@8f4e/compiler-spec';

import { getOrCreateMemoryGuardLocal, linearLastValidStartAddress } from './memoryAccessGuard';

import { getMemoryRegionFields } from '../../semantic/memoryRegions';

import type { AST, CodegenContext, CompilationContext, MemoryAddressRange, StackItem } from '@8f4e/compiler-spec';

const DEFAULT_ACCESS_BYTE_WIDTH = WORD_MEMORY_ACCESS_WIDTH;

export function getClampAccessByteWidth(line: AST[number]): number {
	const argument = line.arguments[0];
	return argument?.type === ArgumentType.LITERAL ? argument.value : DEFAULT_ACCESS_BYTE_WIDTH;
}

export function getModuleAddressRange(context: CodegenContext | CompilationContext): MemoryAddressRange {
	return {
		source: 'module-start',
		...getMemoryRegionFields(context.currentMemoryIndex, context.currentMemoryRegionName),
		byteAddress: context.startingByteAddress,
		safeByteLength: Math.max(0, (context.currentModuleWordAlignedSize ?? 0) * WORD_MEMORY_ACCESS_WIDTH),
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

export function clampAddressByteCode(
	context: CodegenContext | CompilationContext,
	line: AST[number],
	lowerByteAddress: number,
	upperByteAddressCode: number[]
): number[] {
	const addressLocal = getOrCreateMemoryGuardLocal(context, `__clampAddress_${line.lineNumberAfterMacroExpansion}`, {
		isInteger: true,
	});

	return [
		...localSet(addressLocal.index),
		...i32const(lowerByteAddress),
		...localGet(addressLocal.index),
		...localGet(addressLocal.index),
		...i32const(lowerByteAddress),
		WASM_I32_LT_S,
		WASM_SELECT,
		...localSet(addressLocal.index),
		...upperByteAddressCode,
		...localGet(addressLocal.index),
		...localGet(addressLocal.index),
		...upperByteAddressCode,
		WASM_I32_GT_U,
		WASM_SELECT,
	];
}

export function rangeUpperByteAddressCode(range: MemoryAddressRange, accessByteWidth: number): number[] {
	return i32const(range.byteAddress + Math.max(0, range.safeByteLength - accessByteWidth));
}

export function linearUpperByteAddressCode(accessByteWidth: number, memoryIndex = 0): number[] {
	return linearLastValidStartAddress(accessByteWidth, memoryIndex);
}
