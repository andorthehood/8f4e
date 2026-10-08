import { localSet } from '@8f4e/compiler-wasm-utils';
import type { InstructionCompiler, ResolvedLocalSetLine } from '@8f4e/language-spec';

import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler<ResolvedLocalSetLine> = (line, context, facts) => {
	const localName = line.binding.id;
	const local = context.locals[localName]!;
	const pointerFact = facts.localPointer;

	if (pointerFact) {
		local.pointeeMemoryIndex = pointerFact.pointeeMemoryIndex;
		if (pointerFact.pointeeMemoryRegionName) {
			local.pointeeMemoryRegionName = pointerFact.pointeeMemoryRegionName;
		} else {
			delete local.pointeeMemoryRegionName;
		}
	}

	return saveByteCode(context, localSet(local.index));
};

export default _localSet;
