import { br_if } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { BranchIfTrueLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `branchIfTrue`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfTrue: InstructionCompiler<BranchIfTrueLine> = (line: BranchIfTrueLine, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	context.stack.pop()!;
	return saveByteCode(context, br_if(line.arguments[0].value));
};

export default branchIfTrue;
