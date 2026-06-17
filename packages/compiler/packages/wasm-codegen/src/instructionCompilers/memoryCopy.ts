import { i32const, memoryCopy as wasmMemoryCopy } from '@8f4e/compiler-wasm-utils';
import type { InstructionCompiler, ResolvedMemoryCopyLine } from '@8f4e/language-spec';
import { getInstructionSpec } from '@8f4e/language-spec';
import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { guardedMemoryCopy, isSafeMemoryCopy } from './utils/memoryAccessGuard';
import { saveByteCode } from './utils/saveByteCode';
import { requireStackAddress } from './utils/stackItem';

/**
 * Instruction compiler for `memoryCopy`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const memoryCopy: InstructionCompiler<ResolvedMemoryCopyLine> = (line, context, facts) => {
	assertFunctionMemoryIoAllowed(line, context);
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const destinationIndex = operation.addressOperandIndex;
	const destination = requireStackAddress(facts.stackAnalysis.consumedOperands[destinationIndex], line, context);
	const source = requireStackAddress(facts.stackAnalysis.consumedOperands[destinationIndex + 1], line, context);
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
			lineNumber: line.lineNumber,
			memoryCopyByteCode,
		})
	);
};

export default memoryCopy;
