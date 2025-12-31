import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

// Note: This instruction does not use withValidation because it defines a module scope
// rather than operating within one. The withValidation helper is designed for instructions
// that must be inside a specific scope, not for instructions that create new scopes.

/**
 * Instruction compiler for `module`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const _module: InstructionCompiler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});

	context.namespace.moduleName = line.arguments[0].value;

	return context;
};

export default _module;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('module instruction compiler', () => {
		it('starts a module block', () => {
			const context = createInstructionCompilerTestContext({ blockStack: [] });

			_module(
				{
					lineNumber: 1,
					instruction: 'module',
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
				_module({ lineNumber: 1, instruction: 'module', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
