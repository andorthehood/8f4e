import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `local`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const local: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type !== ArgumentType.IDENTIFIER || line.arguments[1].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		context.namespace.locals[line.arguments[1].value] = {
			isInteger: line.arguments[0].value === 'int',
			...(line.arguments[0].value === 'float64' ? { isFloat64: true } : {}),
			index: Object.keys(context.namespace.locals).length,
		};

		return context;
	}
);

export default local;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('local instruction compiler', () => {
		it('adds a local variable', () => {
			const context = createInstructionCompilerTestContext();

			local(
				{
					lineNumber: 1,
					instruction: 'local',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'int' },
						{ type: ArgumentType.IDENTIFIER, value: 'count' },
					],
				} as AST[number],
				context
			);

			expect(context.namespace.locals).toMatchSnapshot();
		});

		it('throws on missing arguments', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				local({ lineNumber: 1, instruction: 'local', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
