import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';
import createDeclarationCompiler from './createDeclarationCompiler';

/**
 * Instruction compiler for `float`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const float: MemoryDeclarationCompiler = createDeclarationCompiler({
	truncate: false,
});

export default float;
