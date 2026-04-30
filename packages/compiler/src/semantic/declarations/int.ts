import createDeclarationCompiler from './createDeclarationCompiler';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `int`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int: InstructionCompiler = createDeclarationCompiler({
	baseType: 'int',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int;
