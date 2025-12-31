import { isConstantName } from '../syntax/isConstantName';
import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `const`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _const: InstructionCompiler = withValidation(
	{
		allowedInConstantsBlocks: true,
	},
	(line, context) => {
		// Constants can be declared at any level (top-level, in modules, or in functions)

		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.LITERAL) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		const constantName = line.arguments[0].value;

		if (!isConstantName(constantName)) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		let value = { value: 0, isInteger: true };

		if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
			if (typeof context.namespace.consts[line.arguments[1].value] !== 'undefined') {
				value = context.namespace.consts[line.arguments[1].value];
			} else {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}
		} else {
			value = line.arguments[1];
		}

		context.namespace.consts[constantName] = value;

		return context;
	}
);

export default _const;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('const instruction compiler', () => {
		it('records constant value', () => {
			const context = createInstructionCompilerTestContext();

			_const(
				{
					lineNumber: 1,
					instruction: 'const',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'MY_CONST' },
						{ type: ArgumentType.LITERAL, value: 7, isInteger: true },
					],
				} as AST[number],
				context
			);

			expect({ consts: context.namespace.consts }).toMatchSnapshot();
		});

		it('throws on undeclared identifier', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				_const(
					{
						lineNumber: 1,
						instruction: 'const',
						arguments: [
							{ type: ArgumentType.IDENTIFIER, value: 'MY_CONST' },
							{ type: ArgumentType.IDENTIFIER, value: 'missing' },
						],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
