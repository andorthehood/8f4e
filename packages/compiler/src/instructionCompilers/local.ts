import { ErrorCode, getError } from '../compilerError';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, LocalDeclarationLine } from '../types';

/**
 * Instruction compiler for `local`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const local: InstructionCompiler<LocalDeclarationLine> = withValidation<LocalDeclarationLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line: LocalDeclarationLine, context) => {
		const typeArg = line.arguments[0];
		const nameArg = line.arguments[1];

		if (Object.prototype.hasOwnProperty.call(context.namespace.memory, nameArg.value)) {
			throw getError(ErrorCode.LOCAL_NAME_COLLISION_WITH_MEMORY, line, context, { identifier: nameArg.value });
		}

		context.locals[nameArg.value] = {
			isInteger: typeArg.value === 'int',
			...(typeArg.value === 'float64' ? { isFloat64: true } : {}),
			index: Object.keys(context.locals).length,
		};

		return context;
	}
);

export default local;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('local instruction compiler', () => {
		it('adds a local variable', () => {
			const context = createInstructionCompilerTestContext();

			local(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'local',
					arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
				} as AST[number],
				context
			);

			expect(context.locals).toMatchSnapshot();
		});

		it('throws when local name collides with a memory identifier', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					namespaces: {},
					consts: {},
					moduleName: 'test',
					memory: {
						count: {
							id: 'count',
							byteAddress: 0,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							numberOfElements: 1,
							elementWordSize: 4,
							type: 0,
							default: 0,
							isInteger: true,
							isPointingToPointer: false,
							isUnsigned: false,
						},
					},
				},
			});

			expect(() =>
				local(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'local',
						arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
					} as AST[number],
					context
				)
			).toThrow();
		});
	});
}
