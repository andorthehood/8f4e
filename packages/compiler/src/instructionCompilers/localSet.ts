import { localSet } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler, ResolvedLocalSetLine } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler<ResolvedLocalSetLine> = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;
	const { local } = line;

	if (local.pointeeBaseType) {
		local.pointeeMemoryIndex = operand.address?.memoryIndex ?? 0;
		if (operand.address) {
			if (operand.address.memoryRegionName) {
				local.pointeeMemoryRegionName = operand.address.memoryRegionName;
			} else {
				delete local.pointeeMemoryRegionName;
			}
		} else {
			delete local.pointeeMemoryRegionName;
		}
	}

	return saveByteCode(context, localSet(local.index));
};

export default _localSet;
