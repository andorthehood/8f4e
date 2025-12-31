import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `use`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const use: InstructionCompiler = function (line, context) {
	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	const namespaceToUse = context.namespace.namespaces[line.arguments[0].value];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };

	return context;
};

export default use;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('use instruction compiler', () => {
		it('merges constants from a namespace', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					consts: { BASE: { value: 1, isInteger: true } },
					namespaces: {
						shared: {
							consts: { EXTRA: { value: 2, isInteger: true } },
						},
					},
				},
			});

			use(
				{
					lineNumber: 1,
					instruction: 'use',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'shared' }],
				} as AST[number],
				context
			);

			expect(context.namespace.consts).toMatchSnapshot();
		});

		it('throws on unknown namespace', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				use(
					{
						lineNumber: 1,
						instruction: 'use',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'missing' }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
