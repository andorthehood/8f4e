import { i32store8, localGet, localSet } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';

import { ErrorCode } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { getOrCreateMemoryGuardLocal, guardedStoreFromLocals, isSafeMemoryAccess } from '../utils/memoryAccessGuard';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, StoreBytesLine } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `storeBytes`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const storeBytes: InstructionCompiler<StoreBytesLine> = withValidation<StoreBytesLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		validateOperands: (line: StoreBytesLine) => {
			const count = line.arguments[0].value;
			return {
				minOperands: count + 1,
				operandTypes: new Array(count + 1).fill('int'),
			};
		},
	},
	(line: StoreBytesLine, context) => {
		assertFunctionMemoryIoAllowed(line, context);
		const count = line.arguments[0].value;

		const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
		const address = context.stack.pop()!;
		const addressIsSafe = isSafeMemoryAccess(address, count);
		for (let i = 0; i < count; i++) {
			context.stack.pop();
		}

		const tempAddrLocal = getOrCreateMemoryGuardLocal(context, `__storeBytesAddr_${lineNumberAfterMacroExpansion}`, {
			isInteger: true,
		});
		const tempByteLocal = getOrCreateMemoryGuardLocal(context, `__storeBytesByte_${lineNumberAfterMacroExpansion}`, {
			isInteger: true,
		});

		const byteCode = [...localSet(tempAddrLocal.index)];
		for (let i = 0; i < count; i++) {
			const storeByteCode = i32store8(undefined, undefined, 0, i);
			byteCode.push(
				...localSet(tempByteLocal.index),
				...(addressIsSafe
					? [...localGet(tempAddrLocal.index), ...localGet(tempByteLocal.index), ...storeByteCode]
					: guardedStoreFromLocals(tempAddrLocal.index, tempByteLocal.index, i + 1, storeByteCode))
			);
		}

		return saveByteCode(context, byteCode);
	}
);

export default storeBytes;
