import createDeclarationCompiler from './createDeclarationCompiler';

import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';

/**
 * Instruction compiler for `int`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int: MemoryDeclarationCompiler = createDeclarationCompiler({
	baseType: 'int',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int;
