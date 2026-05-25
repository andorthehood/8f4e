import { i32store8, localGet, localSet } from '@8f4e/compiler-wasm-utils';
import { getInstructionSpec } from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { getOrCreateMemoryGuardLocal, guardedStoreFromLocals, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { getAddressMemoryIndex } from './utils/memoryAccessTarget';

import type { InstructionCompiler, StoreBytesLine } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `storeBytes`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const storeBytes: InstructionCompiler<StoreBytesLine> = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const count = line.arguments[0].value;
	const operation = getInstructionSpec(line.instruction)?.analysis?.memory;
	if (operation?.kind !== 'storeBytes' || !operation.accessByteWidth) {
		throw new Error(`Missing storeBytes metadata for ${line.instruction}`);
	}

	const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
	const address = line.stackAnalysis.consumedOperands[line.stackAnalysis.consumedOperands.length - 1];
	const addressIsSafe = isSafeMemoryAccess(address, count);
	const memoryIndex = getAddressMemoryIndex(address);

	const tempAddrLocal = getOrCreateMemoryGuardLocal(context, `__storeBytesAddr_${lineNumberAfterMacroExpansion}`, {
		isInteger: true,
	});
	const tempByteLocal = getOrCreateMemoryGuardLocal(context, `__storeBytesByte_${lineNumberAfterMacroExpansion}`, {
		isInteger: true,
	});

	const byteCode = [...localSet(tempAddrLocal.index)];
	for (let i = 0; i < count; i++) {
		const storeByteCode = i32store8(undefined, undefined, 0, i, memoryIndex);
		byteCode.push(
			...localSet(tempByteLocal.index),
			...(addressIsSafe
				? [...localGet(tempAddrLocal.index), ...localGet(tempByteLocal.index), ...storeByteCode]
				: guardedStoreFromLocals(
						tempAddrLocal.index,
						tempByteLocal.index,
						i + operation.accessByteWidth,
						storeByteCode,
						memoryIndex
					))
		);
	}

	return saveByteCode(context, byteCode);
};

export default storeBytes;
