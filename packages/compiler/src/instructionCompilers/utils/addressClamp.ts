import { i32const, localGet, localSet, WASM_I32_GT_U, WASM_I32_LT_S, WASM_SELECT } from '@8f4e/compiler-wasm-utils';

import { getOrCreateMemoryGuardLocal, linearLastValidStartAddress } from './memoryAccessGuard';

export { getClampAccessByteWidth, getClampedAddressStackItem, getModuleAddressRange } from '../../utils/addressClamp';

import type { AST, CodegenContext, CompilationContext, MemoryAddressRange } from '@8f4e/compiler-spec';

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
