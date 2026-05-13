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

import type { CompilationContext, StackItem } from '@8f4e/compiler-spec';

type NumericWasmValueType = typeof Type.I32 | typeof Type.F32 | typeof Type.F64;

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
		(address.safeAddressRange?.safeByteLength ?? 0) >= accessByteWidth ||
		(address.safeMemoryAccessByteWidth ?? 0) >= accessByteWidth
	);
}

export function linearLastValidStartAddress(accessByteWidth: number): number[] {
	return [
		WASMInstruction.MEMORY_SIZE,
		0x00,
		...i32const(1),
		WASMInstruction.I32_SUB,
		...i32const(16),
		WASMInstruction.I32_SHL,
		...i32const(WASM_MEMORY_PAGE_SIZE - accessByteWidth),
		WASMInstruction.I32_ADD,
	];
}

function linearMemoryByteLength(): number[] {
	return [WASMInstruction.MEMORY_SIZE, 0x00, ...i32const(16), WASMInstruction.I32_SHL];
}

function addressWithinMemoryBounds(addressLocalIndex: number, accessByteWidth: number): number[] {
	return [...localGet(addressLocalIndex), ...linearLastValidStartAddress(accessByteWidth), WASMInstruction.I32_LE_U];
}

function rangeWithinMemoryBounds(addressLocalIndex: number, byteLength: number): number[] {
	return [
		...localGet(addressLocalIndex),
		...linearMemoryByteLength(),
		WASMInstruction.I32_LE_U,
		...i32const(byteLength),
		...linearMemoryByteLength(),
		...localGet(addressLocalIndex),
		WASMInstruction.I32_SUB,
		WASMInstruction.I32_LE_U,
		WASMInstruction.I32_AND,
	];
}

function zeroValue(type: NumericWasmValueType): number[] {
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
		WASMInstruction.I32_AND,
		...ifelse(Type.VOID, [
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
		...ifelse(Type.VOID, [...localGet(addressLocalIndex), ...localGet(valueLocalIndex), ...storeByteCode]),
	];
}
