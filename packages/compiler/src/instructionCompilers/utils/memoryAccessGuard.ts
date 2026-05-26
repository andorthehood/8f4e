import {
	f32const,
	f64const,
	i32const,
	ifelse,
	localGet,
	localSet,
	unsignedLEB128,
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

import type { CodegenContext, CompilationContext, StackItem } from '@8f4e/compiler-spec';

type NumericWasmValueType = typeof WASM_TYPE_I32 | typeof WASM_TYPE_F32 | typeof WASM_TYPE_F64;

type GuardedLoadOptions = {
	accessByteWidth: number;
	memoryIndex: number;
	lineNumberAfterMacroExpansion: number;
	resultType: NumericWasmValueType;
	loadByteCode: number[];
};

type GuardedAddressOperationOptions = {
	accessByteWidth: number;
	memoryIndex: number;
	lineNumberAfterMacroExpansion: number;
	resultType: NumericWasmValueType;
	buildTrueBranch: (addressLocalIndex: number) => number[];
	falseByteCode?: number[];
};

type GuardedStoreOptions = {
	value: StackItem;
	accessByteWidth: number;
	memoryIndex: number;
	lineNumberAfterMacroExpansion: number;
	storeByteCode: number[];
};

type GuardedMemoryCopyOptions = {
	byteLength: number;
	destinationMemoryIndex: number;
	sourceMemoryIndex: number;
	lineNumberAfterMacroExpansion: number;
	memoryCopyByteCode: number[];
};

type MemoryGuardContext = CodegenContext | CompilationContext;

export function getOrCreateMemoryGuardLocal(
	context: MemoryGuardContext,
	name: string,
	item: Pick<StackItem, 'valueType'>
) {
	const existing = context.locals[name];
	if (existing) {
		return existing;
	}

	const valueType = item.valueType;
	const local = {
		isInteger: valueType === 'int',
		...(valueType === 'float64' ? { isFloat64: true } : {}),
		index: Math.max(-1, ...Object.values(context.locals).map(local => local.index)) + 1,
	};
	context.locals[name] = local;
	return local;
}

export function isSafeMemoryAccess(address: StackItem, accessByteWidth: number): boolean {
	if (address.kind !== 'address') {
		return false;
	}

	return (
		(address.address.safeRange?.safeByteLength ?? 0) >= accessByteWidth ||
		(address.address.safeAccessByteWidth ?? 0) >= accessByteWidth
	);
}

export function linearLastValidStartAddress(accessByteWidth: number, memoryIndex = 0): number[] {
	return [
		WASM_MEMORY_SIZE,
		...unsignedLEB128(memoryIndex),
		...i32const(1),
		WASM_I32_SUB,
		...i32const(16),
		WASM_I32_SHL,
		...i32const(WASM_MEMORY_PAGE_SIZE - accessByteWidth),
		WASM_I32_ADD,
	];
}

function linearMemoryByteLength(memoryIndex: number): number[] {
	return [WASM_MEMORY_SIZE, ...unsignedLEB128(memoryIndex), ...i32const(16), WASM_I32_SHL];
}

function addressWithinMemoryBounds(addressLocalIndex: number, accessByteWidth: number, memoryIndex: number): number[] {
	return [...localGet(addressLocalIndex), ...linearLastValidStartAddress(accessByteWidth, memoryIndex), WASM_I32_LE_U];
}

function rangeWithinMemoryBounds(addressLocalIndex: number, byteLength: number, memoryIndex: number): number[] {
	return [
		...localGet(addressLocalIndex),
		...linearMemoryByteLength(memoryIndex),
		WASM_I32_LE_U,
		...i32const(byteLength),
		...linearMemoryByteLength(memoryIndex),
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

export function guardedLoad(context: MemoryGuardContext, options: GuardedLoadOptions): number[] {
	return guardedAddressOperation(context, {
		...options,
		buildTrueBranch: addressLocalIndex => [...localGet(addressLocalIndex), ...options.loadByteCode],
	});
}

export function guardedAddressOperation(
	context: MemoryGuardContext,
	options: GuardedAddressOperationOptions
): number[] {
	const addressLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryGuardAddr_${options.lineNumberAfterMacroExpansion}`,
		{
			valueType: 'int',
		}
	);

	return [
		...localSet(addressLocal.index),
		...addressWithinMemoryBounds(addressLocal.index, options.accessByteWidth, options.memoryIndex),
		...ifelse(
			options.resultType,
			options.buildTrueBranch(addressLocal.index),
			options.falseByteCode ?? zeroValue(options.resultType)
		),
	];
}

export function guardedStore(context: MemoryGuardContext, options: GuardedStoreOptions): number[] {
	const addressLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryGuardAddr_${options.lineNumberAfterMacroExpansion}`,
		{
			valueType: 'int',
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
		...addressWithinMemoryBounds(addressLocal.index, options.accessByteWidth, options.memoryIndex),
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

export function guardedMemoryCopy(context: MemoryGuardContext, options: GuardedMemoryCopyOptions): number[] {
	const destinationLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryCopyDestination_${options.lineNumberAfterMacroExpansion}`,
		{
			valueType: 'int',
		}
	);
	const sourceLocal = getOrCreateMemoryGuardLocal(
		context,
		`__memoryCopySource_${options.lineNumberAfterMacroExpansion}`,
		{
			valueType: 'int',
		}
	);

	return [
		...localSet(sourceLocal.index),
		...localSet(destinationLocal.index),
		...rangeWithinMemoryBounds(destinationLocal.index, options.byteLength, options.destinationMemoryIndex),
		...rangeWithinMemoryBounds(sourceLocal.index, options.byteLength, options.sourceMemoryIndex),
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
	storeByteCode: number[],
	memoryIndex = 0
): number[] {
	return [
		...addressWithinMemoryBounds(addressLocalIndex, accessByteWidth, memoryIndex),
		...ifelse(WASM_TYPE_VOID, [...localGet(addressLocalIndex), ...localGet(valueLocalIndex), ...storeByteCode]),
	];
}
