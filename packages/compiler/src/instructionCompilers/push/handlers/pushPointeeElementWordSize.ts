import { ErrorCode, getError } from '../../../compilerError';
import extractPointeeElementWordSizeBase from '../../../syntax/extractPointeeElementWordSizeBase';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getDataStructure, getPointeeElementWordSize } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';

import type { AST, CompilationContext } from '../../../types';

export default function pushPointeeElementWordSize(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const base = extractPointeeElementWordSizeBase(argument.value);
	const memoryItem = getDataStructure(context.namespace.memory, base);

	if (!memoryItem?.isPointer) {
		throw getError(ErrorCode.POINTEE_WORD_SIZE_ON_NON_POINTER, line, context, { identifier: base });
	}

	context.stack.push({ isInteger: true, isNonZero: true });
	return saveByteCode(context, i32const(getPointeeElementWordSize(context.namespace.memory, base)));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushPointeeElementWordSize', () => {
		it('pushes 4 for int* pointer', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 0,
							default: 0,
							isInteger: true,
							isPointer: true,
							isPointingToInteger: true,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'int*',
						} as never,
					},
				},
			});

			pushPointeeElementWordSize(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'sizeof(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(4));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('pushes 4 for float* pointer', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 0,
							default: 0,
							isInteger: true,
							isPointer: true,
							isPointingToInteger: false,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'float*',
						} as never,
					},
				},
			});

			pushPointeeElementWordSize(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'sizeof(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(4));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('pushes 8 for float64* pointer', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 0,
							default: 0,
							isInteger: true,
							isPointer: true,
							isPointingToInteger: false,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'float64*',
						} as never,
					},
				},
			});

			pushPointeeElementWordSize(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'sizeof(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(8));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('throws POINTEE_WORD_SIZE_ON_NON_POINTER for non-pointer identifier', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 0,
							default: 0,
							isInteger: true,
							isPointer: false,
							isPointingToInteger: false,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'int',
						} as never,
					},
				},
			});

			expect(() => {
				pushPointeeElementWordSize(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'sizeof(*buffer)' }],
					} as AST[number],
					context
				);
			}).toThrow();
		});
	});
}
