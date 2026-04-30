import { i32const, localGet, localSet, WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { ArgumentType } from '@8f4e/compiler-types';

import { getOrCreateMemoryGuardLocal, linearLastValidStartAddress } from './memoryAccessGuard';

import { WORD_MEMORY_ACCESS_WIDTH } from '../consts';

import type { AST, CompilationContext, MemoryAddressRange, StackItem } from '@8f4e/compiler-types';

const DEFAULT_ACCESS_BYTE_WIDTH = WORD_MEMORY_ACCESS_WIDTH;

export function getClampAccessByteWidth(line: AST[number]): number {
	const argument = line.arguments[0];
	return argument?.type === ArgumentType.LITERAL ? argument.value : DEFAULT_ACCESS_BYTE_WIDTH;
}

export function getModuleAddressRange(context: CompilationContext): MemoryAddressRange {
	return {
		source: 'module-start',
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
	const safeMemoryAccessByteWidth = Math.min(accessByteWidth, range?.safeByteLength ?? accessByteWidth);
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
		...(range ? { memoryAddressRange: range } : {}),
		...(safeMemoryAccessByteWidth > 0 ? { safeMemoryAccessByteWidth } : {}),
	};
}

export function clampAddressByteCode(
	context: CompilationContext,
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
		WASMInstruction.I32_LT_U,
		WASMInstruction.SELECT,
		...localSet(addressLocal.index),
		...upperByteAddressCode,
		...localGet(addressLocal.index),
		...localGet(addressLocal.index),
		...upperByteAddressCode,
		WASMInstruction.I32_GT_U,
		WASMInstruction.SELECT,
	];
}

export function rangeUpperByteAddressCode(range: MemoryAddressRange, accessByteWidth: number): number[] {
	return i32const(range.byteAddress + Math.max(0, range.safeByteLength - accessByteWidth));
}

export function linearUpperByteAddressCode(accessByteWidth: number): number[] {
	return linearLastValidStartAddress(accessByteWidth);
}
