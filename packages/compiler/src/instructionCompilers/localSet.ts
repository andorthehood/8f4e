import { localSet } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import { requireStackAddress } from '../utils/stackItem';

import type { InstructionCompiler, ResolvedLocalSetLine } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler<ResolvedLocalSetLine> = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;
	const { local } = line;

	if (local.pointeeBaseType) {
		const address = requireStackAddress(operand, line, context);
		local.pointeeMemoryIndex = address.address.memoryIndex;
		if (address.address.memoryRegionName) {
			local.pointeeMemoryRegionName = address.address.memoryRegionName;
		} else {
			delete local.pointeeMemoryRegionName;
		}
	}

	return saveByteCode(context, localSet(local.index));
};

export default _localSet;
