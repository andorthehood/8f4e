import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `constants`.
 */
const constants: InstructionCompiler = withValidation(
	{
		allowedInConstantsBlocks: true,
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.LITERAL) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		if (context.blockStack.length > 0) {
			throw getError(ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
		}

		context.blockStack.push({
			hasExpectedResult: false,
			expectedResultIsInteger: false,
			blockType: BLOCK_TYPE.CONSTANTS,
		});

		context.namespace.moduleName = line.arguments[0].value;

		return context;
	}
);

export default constants;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('constants instruction compiler', () => {
		it('starts constants block and records module name', () => {
			const context = createInstructionCompilerTestContext({ blockStack: [] });

			constants(
				{
					lineNumber: 1,
					instruction: 'constants',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'demo' }],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				moduleName: context.namespace.moduleName,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext({ blockStack: [] });

			expect(() => {
				constants({ lineNumber: 1, instruction: 'constants', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
