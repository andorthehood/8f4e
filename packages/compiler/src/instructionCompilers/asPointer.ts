import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `asPointer`.
 * The instruction only changes compiler stack metadata, so it emits no bytecode.
 */
const asPointer: InstructionCompiler = (line, context) => context;

export default asPointer;
