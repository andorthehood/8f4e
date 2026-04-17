import createDeclarationCompiler from './createDeclarationCompiler';

import type { InstructionCompiler } from '../../types';

/**
 * Instruction compiler for `float64`, `float64*`, `float64**`.
 *
 * Scalar `float64` occupies two 4-byte words (elementWordSize = 8) and must
 * start on an even word boundary so its byteAddress is divisible by 8, making
 * Float64Array / DataView access safe.  The global allocation grid stays at
 * 4 bytes; alignment padding (0 or 1 word) is absorbed into wordAlignedSize.
 *
 * Pointer variants (`float64*`, `float64**`) store a 4-byte address, identical
 * to `float*` in allocation width, but carry float64 pointer typing metadata.
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const float64: InstructionCompiler = createDeclarationCompiler({
	baseType: 'float64',
	truncate: false,
	nonPointerElementWordSize: 8,
});

export default float64;
