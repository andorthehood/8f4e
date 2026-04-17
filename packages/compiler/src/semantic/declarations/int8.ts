import createDeclarationCompiler from './createDeclarationCompiler';

import type { InstructionCompiler } from '../../types';

/**
 * Instruction compiler for `int8*`, `int8**`.
 *
 * Pointer variants store a 4-byte address (elementWordSize = 4), identical
 * to `int*` in allocation width, but carry int8 pointer typing metadata.
 * The pointee width is 1 byte (signed 8-bit integer).
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int8: InstructionCompiler = createDeclarationCompiler({
	baseType: 'int8',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int8;
