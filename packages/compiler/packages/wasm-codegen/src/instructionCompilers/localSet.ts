import { localSet } from '@8f4e/compiler-wasm-utils';
import type { InstructionCompiler, ResolvedLocalSetLine } from '@8f4e/language-spec';

import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler<ResolvedLocalSetLine> = (line, context) => {
	const localName = line.binding.id;
	const local = context.locals[localName]!;

	return saveByteCode(context, localSet(local.index));
};

export default _localSet;
