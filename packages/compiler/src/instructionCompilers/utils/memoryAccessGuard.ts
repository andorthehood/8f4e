import {
	f32const,
	f64const,
	i32const,
	ifelse,
	localGet,
	localSet,
	WASM_I32_ADD,
	WASM_I32_AND,
	WASM_I32_LE_U,
	WASM_I32_SHL,
	WASM_I32_SUB,
	WASM_MEMORY_PAGE_SIZE,
	WASM_MEMORY_SIZE,
	WASM_TYPE_F32,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
	WASM_TYPE_VOID,
} from '@8f4e/compiler-wasm-utils';

import type { CompilationContext, StackItem } from '@8f4e/compiler-spec';

type NumericWasmValueType = typeof WASM_TYPE_I32 | typeof WASM_TYPE_F32 | typeof WASM_TYPE_F64;

type GuardedLoadOptions = {
	accessByteWidth: number;
	lineNumberAfterMacroExpansion: number;
	resultType: NumericWasmValueType;
	loadByteCode: number[];
};

type GuardedStoreOptions = {
	value: StackItem;
	accessByteWidth: number;
	lineNumberAfterMacroExpansion: number;
	storeByteCode: number[];
};

type GuardedMemoryCopyOptions = {
	byteLength: number;
	lineNumberAfterMacroExpansion: number;
	memoryCopyByteCode: number[];
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
	return (
		(address.address?.safeRange?.safeByteLength ?? 0) >= accessByteWidth ||
		(address.address?.safeAccessByteWidth ?? 0) >= accessByteWidth
	);
}

export function linearLastValidStartAddress(accessByteWidth: number): number[] {
	return [
		WASM_MEMORY_SIZE,
		0x00,
		...i32const(1),
		WASM_I32_SUB,
		...i32const(16),
		WASM_I32_SHL,
		...i32const(WASM_MEMORY_PAGE_SIZE - accessByteWidth),
		WASM_I32_ADD,
	];
}

function linearMemoryByteLength(): number[] {
	return [WASM_MEMORY_SIZE, 0x00, ...i32const(16), WASM_I32_SHL];
}

function addressWithinMemoryBounds(addressLocalIndex: number, accessByteWidth: number): number[] {
	return [...localGet(addressLocalIndex), ...linearLastValidStartAddress(accessByteWidth), WASM_I32_LE_U];
}

function rangeWithinMemoryBounds(addressLocalIndex: number, byteLength: number): number[] {
	return [
		...localGet(addressLocalIndex),
		...linearMemoryByteLength(),
		WASM_I32_LE_U,
		...i32const(byteLength),
		...linearMemoryByteLength(),
		...localGet(addressLocalIndex),
		WASM_I32_SUB,
		WASM_I32_LE_U,
		WASM_I32_AND,
	];
}

function zeroValue(type: NumericWasmValueType): number[] {
	if (type === WASM_TYPE_F64) {
		return f64const(0);
	}

	return type === WASM_TYPE_F32 ? f32const(0) : i32const(0);
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
		...ifelse(WASM_TYPE_VOID, [
			...localGet(addressLocal.index),
			...localGet(valueLocal.index),
			...options.storeByteCode,
		]),
	];
}

export function isSafeMemoryCopy(destination: StackItem, source: StackItem, byteLength: number): boolean {
	return byteLength > 0 && isSafeMemoryAccess(destination, byteLength) && isSafeMemoryAccess(source, byteLength);
}

export function guardedMemoryCopy(context: CompilationContext, options: GuardedMemoryCopyOptions): number[] {
	const destinationLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryCopyDestination_${options.lineNumberAfterMacroExpansion}`,
		{
			isInteger: true,
		}
	);
	const sourceLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryCopySource_${options.lineNumberAfterMacroExpansion}`,
		{
			isInteger: true,
		}
	);

	return [
		...localSet(sourceLocal.index),
		...localSet(destinationLocal.index),
		...rangeWithinMemoryBounds(destinationLocal.index, options.byteLength),
		...rangeWithinMemoryBounds(sourceLocal.index, options.byteLength),
		WASM_I32_AND,
		...ifelse(WASM_TYPE_VOID, [
			...localGet(destinationLocal.index),
			...localGet(sourceLocal.index),
			...i32const(options.byteLength),
			...options.memoryCopyByteCode,
		]),
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
		...ifelse(WASM_TYPE_VOID, [...localGet(addressLocalIndex), ...localGet(valueLocalIndex), ...storeByteCode]),
	];
}
