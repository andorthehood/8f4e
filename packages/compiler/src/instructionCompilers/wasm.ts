import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `wasm`.
 * @see [Instruction docs](../../docs/instructions/low-level.md)
 */
const wasm: InstructionCompiler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	context.byteCode.push(...[line.arguments[0].value]);
	return context;
};

export default wasm;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('wasm instruction compiler', () => {
		it('emits the provided wasm opcode', () => {
			const context = createInstructionCompilerTestContext();

			wasm(
				{
					lineNumber: 1,
					instruction: 'wasm',
					arguments: [{ type: ArgumentType.LITERAL, value: 42, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				wasm({ lineNumber: 1, instruction: 'wasm', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
