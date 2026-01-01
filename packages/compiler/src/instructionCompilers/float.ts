import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import { parseMemoryInstructionArguments } from '../utils/memoryInstructionParser';
import { getMemoryFlags } from '../utils/memoryFlags';
import { getPointerDepth } from '../syntax/getPointerDepth';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import { createInstructionCompilerTestContext } from '../utils/testUtils';
import { ArgumentType } from '../types';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('float instruction compiler', () => {
		it('creates a float memory entry', () => {
			const context = createInstructionCompilerTestContext();

			float(
				{
					lineNumber: 1,
					instruction: 'float',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'temperature' }],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});
	});
}
