import {
	f32const,
	f64const,
	i32const,
	ifelse,
	localGet,
	localSet,
	Type,
	WASM_MEMORY_PAGE_SIZE,
	WASMInstruction,
} from '@8f4e/compiler-wasm-utils';

import type { CompilationContext, StackItem } from '@8f4e/compiler-types';

type GuardedLoadOptions = {
	accessByteWidth: number;
	lineNumberAfterMacroExpansion: number;
	resultType: Type.I32 | Type.F32 | Type.F64;
	loadByteCode: number[];
};

type GuardedStoreOptions = {
	value: StackItem;
	accessByteWidth: number;
	lineNumberAfterMacroExpansion: number;
	storeByteCode: number[];
};

export function getOrCreateMemoryGuardLocal(
	context: CompilationContext,
	name: string,
	item: Pick<StackItem, 'isInteger' | 'isFloat64'>
) {
	const existing = context.locals[name];
	if (existing) {
		return existing;
	}

	const local = {
		isInteger: item.isInteger,
		...(item.isFloat64 ? { isFloat64: true } : {}),
		index: Object.keys(context.locals).length,
	};
	context.locals[name] = local;
	return local;
}

export function isSafeMemoryAccess(address: StackItem, accessByteWidth: number): boolean {
	return (address.memoryAddress?.safeByteLength ?? 0) >= accessByteWidth;
}

function addressWithinMemoryBounds(addressLocalIndex: number, accessByteWidth: number): number[] {
	return [
		...localGet(addressLocalIndex),
		WASMInstruction.MEMORY_SIZE,
		0x00,
		...i32const(1),
		WASMInstruction.I32_SUB,
		...i32const(16),
		WASMInstruction.I32_SHL,
		...i32const(WASM_MEMORY_PAGE_SIZE - accessByteWidth),
		WASMInstruction.I32_ADD,
		WASMInstruction.I32_LE_U,
	];
}

function zeroValue(type: Type.I32 | Type.F32 | Type.F64): number[] {
	if (type === Type.F64) {
		return f64const(0);
	}

	return type === Type.F32 ? f32const(0) : i32const(0);
}

export function guardedLoad(context: CompilationContext, options: GuardedLoadOptions): number[] {
	const addressLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryGuardAddr_${options.lineNumberAfterMacroExpansion}`,
		{
			isInteger: true,
		}
	);

	return [
		...localSet(addressLocal.index),
		...addressWithinMemoryBounds(addressLocal.index, options.accessByteWidth),
		...ifelse(
			options.resultType,
			[...localGet(addressLocal.index), ...options.loadByteCode],
			zeroValue(options.resultType)
		),
	];
}

export function guardedStore(context: CompilationContext, options: GuardedStoreOptions): number[] {
	const addressLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryGuardAddr_${options.lineNumberAfterMacroExpansion}`,
		{
			isInteger: true,
		}
	);
	const valueLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryGuardValue_${options.lineNumberAfterMacroExpansion}`,
		options.value
	);

	return [
		...localSet(valueLocal.index),
		...localSet(addressLocal.index),
		...addressWithinMemoryBounds(addressLocal.index, options.accessByteWidth),
		...ifelse(Type.VOID, [...localGet(addressLocal.index), ...localGet(valueLocal.index), ...options.storeByteCode]),
	];
}

export function guardedStoreFromLocals(
	addressLocalIndex: number,
	valueLocalIndex: number,
	accessByteWidth: number,
	storeByteCode: number[]
): number[] {
	return [
		...addressWithinMemoryBounds(addressLocalIndex, accessByteWidth),
		...ifelse(Type.VOID, [...localGet(addressLocalIndex), ...localGet(valueLocalIndex), ...storeByteCode]),
	];
}
