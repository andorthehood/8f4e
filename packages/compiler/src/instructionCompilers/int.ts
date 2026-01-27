import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import parseMemoryInstructionArguments from '../utils/memoryInstructionParser';
import getMemoryFlags from '../utils/memoryFlags';
import getPointerDepth from '../syntax/getPointerDepth';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { ArgumentType } from '../types';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

/**
 * Instruction compiler for `int`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int: InstructionCompiler = withValidation(
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
		const flags = getMemoryFlags('int', pointerDepth);

		// Truncate float values to integers (e.g., 1/16 → 0.0625 → 0)
		const truncatedDefault = Math.trunc(defaultValue);

		context.namespace.memory[id] = {
			numberOfElements: 1,
			elementWordSize: 4,
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			wordAlignedSize: 1,
			byteAddress: context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			id,
			default: truncatedDefault,
			type: line.instruction as unknown as MemoryTypes,
			...flags,
		};

		return context;
	}
);

export default int;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('int instruction compiler', () => {
		it('creates an int memory entry', () => {
			const context = createInstructionCompilerTestContext();

			int(
				{
					lineNumber: 1,
					instruction: 'int',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'counter' }],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});
	});
}
