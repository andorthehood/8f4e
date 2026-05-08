import { i32const, memoryCopy as wasmMemoryCopy } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';

import { saveByteCode } from '../utils/compilation';
import { guardedMemoryCopy, isSafeMemoryCopy } from '../utils/memoryAccessGuard';

import type { InstructionCompiler, NormalizedMemoryCopyLine } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `memoryCopy`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const memoryCopy: InstructionCompiler<NormalizedMemoryCopyLine> = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const source = context.stack.pop()!;
	const destination = context.stack.pop()!;
	const byteLength = line.arguments[0].value;
	const memoryCopyByteCode = wasmMemoryCopy();

	if (byteLength === 0) {
		return context;
	}

	if (isSafeMemoryCopy(destination, source, byteLength)) {
		return saveByteCode(context, [...i32const(byteLength), ...memoryCopyByteCode]);
	}

	return saveByteCode(
		context,
		guardedMemoryCopy(context, {
			byteLength,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			memoryCopyByteCode,
		})
	);
};

export default memoryCopy;
