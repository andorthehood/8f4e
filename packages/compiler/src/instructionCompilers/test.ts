import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#test` compiler directive.
 * Marks a module for execution by the test runner instead of the normal cycle dispatcher.
 */
const test: InstructionCompiler = function (line, context) {
	context.testExecution = true;

	return context;
};

export default test;
