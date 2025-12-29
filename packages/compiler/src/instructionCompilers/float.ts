import {
	calculateWordAlignedSizeOfMemory,
	parseMemoryInstructionArguments,
	getPointerDepth,
	getMemoryFlags,
} from '../utils';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { InstructionCompiler, MemoryTypes } from '../types';

/**
 * Instruction compiler for `float`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const float: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const wordAlignedAddress = calculateWordAlignedSizeOfMemory(context.namespace.memory);
		const { id, defaultValue } = parseMemoryInstructionArguments(
			line.arguments,
			line.lineNumber,
			line.instruction,
			context
		);
		const pointerDepth = getPointerDepth(line.instruction);
		const flags = getMemoryFlags('float', pointerDepth);

		context.namespace.memory[id] = {
			numberOfElements: 1,
			elementWordSize: 4,
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			wordAlignedSize: 1,
			byteAddress: context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			id,
			default: defaultValue,
			type: line.instruction as unknown as MemoryTypes,
			...flags,
		};

		return context;
	}
);

export default float;
