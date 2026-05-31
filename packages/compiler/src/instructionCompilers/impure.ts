import type { ImpureLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#impure` compiler directive.
 * Marks a function as allowed to perform explicit memory IO.
 */
const impure: InstructionCompiler<ImpureLine> = (line, context) => {
	context.currentFunctionIsImpure = true;

	return context;
};

export default impure;
