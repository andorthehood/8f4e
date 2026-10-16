import { f32load, WASM_TYPE_F32 } from '@8f4e/compiler-wasm-utils';
import type { ASTLineBase, FloatLoadInstructionSpecName, InstructionCompiler } from '@8f4e/language-spec';
import { getInstructionSpec } from '@8f4e/language-spec';
import { guardedLoad, isSafeMemoryAccess } from './utils/memoryAccessGuard';
import { saveByteCode } from './utils/saveByteCode';

type LoadFloatLine = ASTLineBase<FloatLoadInstructionSpecName, []>;

/**
 * Instruction compiler for `loadFloat`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const loadFloat: InstructionCompiler<LoadFloatLine> = (line, context, facts) => {
	const [rawAddress] = facts.stackAnalysis.consumedOperands;
	const address = rawAddress;
	const operation = getInstructionSpec(line.instruction).effects.memory;
	const accessByteWidth = operation.accessByteWidth;

	const instructions = f32load(2, 0);
	if (isSafeMemoryAccess(address, accessByteWidth)) {
		return saveByteCode(context, instructions);
	}

	return saveByteCode(
		context,
		guardedLoad(context, {
			accessByteWidth,
			lineNumber: line.lineNumber,
			resultType: WASM_TYPE_F32,
			loadByteCode: instructions,
		})
	);
};

export default loadFloat;
