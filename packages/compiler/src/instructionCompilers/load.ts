import type { ASTLineBase, InstructionCompiler, LoadInstructionSpecName, MemoryLoadVariant } from '@8f4e/compiler-spec';
import { getInstructionSpec } from '@8f4e/compiler-spec';
import {
	f32load,
	i32load,
	i32load8s,
	i32load8u,
	i32load16s,
	i32load16u,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import { requireStackAddress } from '../utils/stackItem';
import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { guardedLoad, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { saveByteCode } from './utils/saveByteCode';

type LoadLine = ASTLineBase<LoadInstructionSpecName, []>;

/**
 * Instruction compiler for `load` variants.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const loadVariantByteCode: Record<MemoryLoadVariant, (memoryIndex: number) => number[]> = {
	i32: memoryIndex => i32load(2, 0, memoryIndex),
	i32_8s: memoryIndex => i32load8s(0, 0, memoryIndex),
	i32_8u: memoryIndex => i32load8u(0, 0, memoryIndex),
	i32_16s: memoryIndex => i32load16s(1, 0, memoryIndex),
	i32_16u: memoryIndex => i32load16u(1, 0, memoryIndex),
	f32: memoryIndex => f32load(2, 0, memoryIndex),
};

const load: InstructionCompiler<LoadLine> = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const [rawAddress] = line.stackAnalysis.consumedOperands;
	const address = requireStackAddress(rawAddress, line, context);
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const buildInstructions = loadVariantByteCode[operation.loadVariant];
	const memoryIndex = address.address.memoryIndex;
	const instructions = buildInstructions(memoryIndex);
	const accessByteWidth = operation.accessByteWidth;
	if (isSafeMemoryAccess(address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedLoad(context, {
			accessByteWidth,
			memoryIndex,
			lineNumberAfterMacroExpansion: line.lineNumberAfterMacroExpansion,
			resultType: WASM_TYPE_I32,
			loadByteCode: instructions,
		})
	);
};

export default load;
