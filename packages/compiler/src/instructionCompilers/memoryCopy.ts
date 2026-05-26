import { i32const, memoryCopy as wasmMemoryCopy } from '@8f4e/compiler-wasm-utils';
import { getInstructionSpec } from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { guardedMemoryCopy, isSafeMemoryCopy } from './utils/memoryAccessGuard';

import { requireStackAddress } from '../utils/stackItem';

import type { InstructionCompiler, NormalizedMemoryCopyLine } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `memoryCopy`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const memoryCopy: InstructionCompiler<NormalizedMemoryCopyLine> = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const destinationIndex = operation.addressOperandIndex;
	const destination = requireStackAddress(line.stackAnalysis.consumedOperands[destinationIndex], line, context);
	const source = requireStackAddress(line.stackAnalysis.consumedOperands[destinationIndex + 1], line, context);
	const byteLength = line.arguments[0].value;
	const destinationMemoryIndex = destination.address.memoryIndex;
	const sourceMemoryIndex = source.address.memoryIndex;
	const memoryCopyByteCode = wasmMemoryCopy(destinationMemoryIndex, sourceMemoryIndex);

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
			destinationMemoryIndex,
			sourceMemoryIndex,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			memoryCopyByteCode,
		})
	);
};

export default memoryCopy;
