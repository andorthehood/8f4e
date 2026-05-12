import createDeclarationCompiler from './createDeclarationCompiler';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `float`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const float: InstructionCompiler = createDeclarationCompiler({
	baseType: 'float',
	truncate: false,
	nonPointerElementWordSize: 4,
});

export default float;
