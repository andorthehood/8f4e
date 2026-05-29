import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#mock`.
 * Project builds decide whether mock-marked blocks are included; once included,
 * the directive itself has no runtime behavior.
 */
const mock: InstructionCompiler = function (line, context) {
	return context;
};

export default mock;
