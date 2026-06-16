import type { InstructionCompiler } from '@8f4e/language-spec';

/**
 * Instruction compiler for `#skipExecution` compiler directive.
 * Marks a module to skip execution in the group dispatcher while preserving
 * normal compilation and memory initialization behavior.
 */
const skipExecution: InstructionCompiler = (line, context) => {
	// Set the metadata flag (idempotent - multiple calls have no additional effect)
	context.skipExecutionInCycle = true;

	return context;
};

export default skipExecution;
