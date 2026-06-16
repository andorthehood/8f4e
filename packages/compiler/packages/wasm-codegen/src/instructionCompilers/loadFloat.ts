import { f32load, WASM_TYPE_F32 } from '@8f4e/compiler-wasm-utils';
import type { ASTLineBase, FloatLoadInstructionSpecName, InstructionCompiler } from '@8f4e/language-spec';
import { getInstructionSpec } from '@8f4e/language-spec';
import assertFunctionMemoryIoAllowed from './assertFunctionMemoryIoAllowed';
import { guardedLoad, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { saveByteCode } from './utils/saveByteCode';
import { requireStackAddress } from './utils/stackItem';

type LoadFloatLine = ASTLineBase<FloatLoadInstructionSpecName, []>;

/**
 * Instruction compiler for `loadFloat`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const loadFloat: InstructionCompiler<LoadFloatLine> = (line, context) => {
	assertFunctionMemoryIoAllowed(line, context);
	const [rawAddress] = line.stackAnalysis.consumedOperands;
	const address = requireStackAddress(rawAddress, line, context);
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const accessByteWidth = operation.accessByteWidth;

	const memoryIndex = address.address.memoryIndex;
	const instructions = f32load(2, 0, memoryIndex);
	if (isSafeMemoryAccess(address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedLoad(context, {
			accessByteWidth,
			memoryIndex,
			lineNumber: line.lineNumber,
			resultType: WASM_TYPE_F32,
			loadByteCode: instructions,
		})
	);
};

export default loadFloat;
