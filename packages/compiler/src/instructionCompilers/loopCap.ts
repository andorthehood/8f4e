import type { InstructionCompiler, LoopCapLine } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `#loopCap` compiler directive.
 * Sets the default loop cap for subsequent loops in the current module or function block.
 * @see [Directive docs](../../docs/directives.md)
 */
const loopCap: InstructionCompiler<LoopCapLine> = (line, context) => {
	context.loopCap = line.arguments[0].value as number;
	return context;
};

export default loopCap;
