import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler, Error } from '../types';

/**
 * Instruction compiler for `block`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const block: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		if (!line.arguments[0] || line.arguments[0].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].value === 'float') {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.BLOCK,
			});
			return saveByteCode(context, [WASMInstruction.BLOCK, Type.F32]);
		}

		if (line.arguments[0].value === 'int') {
			context.blockStack.push({
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.BLOCK,
			});
			return saveByteCode(context, [WASMInstruction.BLOCK, Type.I32]);
		}

		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.BLOCK,
		});

		return saveByteCode(context, [WASMInstruction.BLOCK, Type.VOID]);
	}
);

export default block;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('block instruction compiler', () => {
		it('emits a typed block for float', () => {
			const context = createInstructionCompilerTestContext();

			block(
				{
					lineNumber: 1,
					instruction: 'block',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'float' }],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('emits a typed block for int', () => {
			const context = createInstructionCompilerTestContext();

			block(
				{
					lineNumber: 1,
					instruction: 'block',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'int' }],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('emits a void block for unknown type', () => {
			const context = createInstructionCompilerTestContext();

			block(
				{
					lineNumber: 1,
					instruction: 'block',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'void' }],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();
			let error: Error | undefined;

			try {
				block({ lineNumber: 1, instruction: 'block', arguments: [] } as AST[number], context);
			} catch (caught) {
				error = caught as Error;
			}

			expect({ code: error?.code, message: error?.message }).toMatchSnapshot();
		});
	});
}
