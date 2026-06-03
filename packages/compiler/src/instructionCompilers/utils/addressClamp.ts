import { i32const, localGet, localSet, WASM_I32_GT_U, WASM_I32_LT_S, WASM_SELECT } from '@8f4e/compiler-wasm-utils';

import { getOrCreateMemoryGuardLocal } from './memoryAccessGuard';

export { getClampAccessByteWidth, getClampedAddressStackItem, getModuleAddressRange } from '../../utils/addressClamp';

import type { CodegenContext, CompilationContext, CompilerASTLine, MemoryAddressRange } from '@8f4e/compiler-spec';

/** Builds bytecode that clamps the top stack address between lower and upper bounds. */
export function clampAddressByteCode(
	context: CodegenContext | CompilationContext,
	line: CompilerASTLine,
	lowerByteAddress: number,
	upperByteAddressCode: number[]
): number[] {
	const addressLocal = getOrCreateMemoryGuardLocal(context, `__clampAddress_${line.lineNumber}`, {
		valueType: 'int',
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

/** Builds bytecode for the last valid starting byte address in a memory range. */
export function rangeUpperByteAddressCode(range: MemoryAddressRange, accessByteWidth: number): number[] {
	return i32const(range.byteAddress + Math.max(0, range.safeByteLength - accessByteWidth));
}
