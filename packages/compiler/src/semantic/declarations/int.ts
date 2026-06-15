import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';
import createDeclarationCompiler from './createDeclarationCompiler';

/**
 * Instruction compiler for `int`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int: MemoryDeclarationCompiler = createDeclarationCompiler({
	truncate: true,
});

export default int;
