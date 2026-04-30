import createDeclarationCompiler from './createDeclarationCompiler';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `int16*`, `int16**`.
 *
 * Pointer variants store a 4-byte address (elementWordSize = 4), identical
 * to `int*` in allocation width, but carry int16 pointer typing metadata.
 * The pointee width is 2 bytes (signed 16-bit integer).
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int16: InstructionCompiler = createDeclarationCompiler({
	baseType: 'int16',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int16;
