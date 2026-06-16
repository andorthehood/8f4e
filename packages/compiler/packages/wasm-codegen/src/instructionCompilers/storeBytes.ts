import { i32store8, localGet, localSet } from '@8f4e/compiler-wasm-utils';
import type { InstructionCompiler, StoreBytesLine } from '@8f4e/language-spec';
import { getInstructionSpec } from '@8f4e/language-spec';
import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { getOrCreateMemoryGuardLocal, guardedStoreFromLocals, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { saveByteCode } from './utils/saveByteCode';
import { requireStackAddress } from './utils/stackItem';

/**
 * Instruction compiler for `storeBytes`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const storeBytes: InstructionCompiler<StoreBytesLine> = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const count = line.arguments[0].value;
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const accessByteWidth = operation.accessByteWidth;

	const lineNumber = line.lineNumber;
	const address = requireStackAddress(
		line.stackAnalysis.consumedOperands[line.stackAnalysis.consumedOperands.length - 1],
		line,
		context
	);
	const addressIsSafe = isSafeMemoryAccess(address, count);
	const memoryIndex = address.address.memoryIndex;

	const tempAddrLocal = getOrCreateMemoryGuardLocal(context, `__storeBytesAddr_${lineNumber}`, {
		valueType: 'int',
	});
	const tempByteLocal = getOrCreateMemoryGuardLocal(context, `__storeBytesByte_${lineNumber}`, {
		valueType: 'int',
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
						i + accessByteWidth,
						storeByteCode,
						memoryIndex
					))
		);
	}

	return saveByteCode(context, byteCode);
};

export default storeBytes;
