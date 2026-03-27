import { ErrorCode, getError } from '../../../compilerError';
import extractPointeeElementMaxBase from '../../../syntax/extractPointeeElementMaxBase';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getDataStructure, getPointeeElementMaxValue } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';
import f32const from '../../../wasmUtils/const/f32const';
import f64const from '../../../wasmUtils/const/f64const';
import { constOpcode, kindToStackItem, resolvePointerTargetValueKind } from '../shared';

import type { AST, CompilationContext } from '../../../types';

export default function pushPointeeElementMax(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const base = extractPointeeElementMaxBase(argument.value);
	const memoryItem = getDataStructure(context.namespace.memory, base);

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: base });
	}

	if (!memoryItem.isPointer) {
		throw getError(ErrorCode.POINTEE_ELEMENT_MAX_ON_NON_POINTER, line, context, { identifier: base });
	}

	const kind = memoryItem.isPointingToPointer ? 'int32' : resolvePointerTargetValueKind(memoryItem);
	const maxValue = getPointeeElementMaxValue(context.namespace.memory, base);
	context.stack.push(kindToStackItem(kind, { isNonZero: maxValue !== 0 }));
	return saveByteCode(context, constOpcode[kind](maxValue));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushPointeeElementMax', () => {
		it('pushes max int32 value for int* pointer', () => {
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

			pushPointeeElementMax(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'max(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(2147483647));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('pushes max int16 value for int16* pointer', () => {
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
							isPointingToInt16: true,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'int16*',
						} as never,
					},
				},
			});

			pushPointeeElementMax(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'max(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(32767));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('pushes max float32 value for float* pointer', () => {
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
							isInteger: false,
							isPointer: true,
							isPointingToInteger: false,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'float*',
						} as never,
					},
				},
			});

			pushPointeeElementMax(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'max(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(f32const(3.4028234663852886e38));
			expect(context.stack).toEqual([{ isInteger: false, isNonZero: true }]);
		});

		it('pushes max float64 value for float64* pointer', () => {
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
							isInteger: false,
							isPointer: true,
							isPointingToInteger: false,
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'float64*',
						} as never,
					},
				},
			});

			pushPointeeElementMax(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'max(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(f64const(1.7976931348623157e308));
			expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: true }]);
		});

		it('pushes max int32 value for float64** pointer (pointee is a pointer slot stored as i32)', () => {
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
							isPointingToPointer: true,
							isUnsigned: false,
							type: 'float64**',
						} as never,
					},
				},
			});

			pushPointeeElementMax(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'max(*buffer)' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(2147483647));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('throws UNDECLARED_IDENTIFIER for undeclared identifier', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				pushPointeeElementMax(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'max(*undeclared)' }],
					} as AST[number],
					context
				);
			}).toThrow();
		});

		it('throws POINTEE_ELEMENT_MAX_ON_NON_POINTER for non-pointer identifier', () => {
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
				pushPointeeElementMax(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'max(*buffer)' }],
					} as AST[number],
					context
				);
			}).toThrow();
		});
	});
}
