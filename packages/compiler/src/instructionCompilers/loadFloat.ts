import { f32load, WASM_TYPE_F32 } from '@8f4e/compiler-wasm-utils';
import { getInstructionSpec } from '@8f4e/compiler-spec';

import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { saveByteCode } from './utils/saveByteCode';
import { guardedLoad, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { getAddressMemoryIndex } from './utils/memoryAccessTarget';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `loadFloat`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const loadFloat: InstructionCompiler = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const [address] = line.stackAnalysis.consumedOperands;
	const operation = getInstructionSpec(line.instruction)?.analysis?.memory;
	if (operation?.kind !== 'load' || operation.loadVariant !== 'f32' || !operation.accessByteWidth) {
		throw new Error(`Missing load metadata for ${line.instruction}`);
	}

	const memoryIndex = getAddressMemoryIndex(address);
	const instructions = f32load(2, 0, memoryIndex);
	if (isSafeMemoryAccess(address, operation.accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedLoad(context, {
			accessByteWidth: operation.accessByteWidth,
			memoryIndex,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			resultType: WASM_TYPE_F32,
			loadByteCode: instructions,
		})
	);
};

export default loadFloat;
