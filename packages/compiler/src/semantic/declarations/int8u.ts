import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';
import createDeclarationCompiler from './createDeclarationCompiler';

/**
 * Instruction compiler for `int8u*`, `int8u**`.
 *
 * Pointer variants store a 4-byte address and carry unsigned int8 pointee
 * metadata so typed dereference can use unsigned 8-bit loads.
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int8u: MemoryDeclarationCompiler = createDeclarationCompiler({
	truncate: true,
});

export default int8u;
