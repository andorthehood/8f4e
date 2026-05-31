import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';
import createDeclarationCompiler from './createDeclarationCompiler';

/**
 * Instruction compiler for `int16u*`, `int16u**`.
 *
 * Pointer variants store a 4-byte address and carry unsigned int16 pointee
 * metadata so typed dereference can use unsigned 16-bit loads.
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int16u: MemoryDeclarationCompiler = createDeclarationCompiler({
	baseType: 'int16u',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int16u;
