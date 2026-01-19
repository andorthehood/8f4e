import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

/**
 * Instruction compiler for `int[]` and `float[]`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const buffer: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.LITERAL) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		const wordAlignedAddress = calculateWordAlignedSizeOfMemory(context.namespace.memory);

		let numberOfElements = 1;
		const elementWordSize = line.instruction.includes('8') ? 1 : line.instruction.includes('16') ? 2 : 4;

		if (line.arguments[1].type === ArgumentType.LITERAL) {
			numberOfElements = line.arguments[1].value;
		} else {
			const constant = context.namespace.consts[line.arguments[1].value];

			if (!constant) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			numberOfElements = constant.value;
		}

		context.namespace.memory[line.arguments[0].value] = {
			numberOfElements,
			elementWordSize,
			wordAlignedSize: Math.ceil((numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY),
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			id: line.arguments[0].value,
			byteAddress: context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			default: {},
			isInteger: line.instruction.startsWith('int') || line.instruction.includes('*'),
			isPointer: line.instruction.includes('*'),
			isPointingToInteger: line.instruction.startsWith('int') && line.instruction.includes('*'),
			isPointingToPointer: line.instruction.includes('**'),
			type: line.instruction.slice(0, -2) as unknown as MemoryTypes,
		};

		return context;
	}
);

export default buffer;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('buffer instruction compiler', () => {
		it('creates a memory buffer entry', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'values' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});

		it('throws on missing arguments', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				buffer({ lineNumber: 1, instruction: 'int[]', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
