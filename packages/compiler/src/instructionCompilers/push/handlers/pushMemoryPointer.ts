import { i32const, f64load, i32load, i32load8s, i32load16s } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { getDataStructure } from '../../../utils/memoryData';
import { kindToStackItem, loadOpcode, resolvePointerTargetValueKind } from '../shared';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

export default function pushMemoryPointer(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
	const memory = context.namespace.memory;
	const base = line.arguments[0].targetMemoryId!;
	const memoryItem = getDataStructure(memory, base)!;

	const kind = resolvePointerTargetValueKind(memoryItem);
	context.stack.push(kindToStackItem(kind, { isNonZero: false }));

	// For int8* and int8**, use i32load8s (sign-extended 8-bit load) for the final dereference.
	// For int16* and int16**, use i32load16s (sign-extended 16-bit load) for the final dereference.
	const finalLoad =
		memoryItem.pointeeBaseType === 'int8'
			? i32load8s()
			: memoryItem.pointeeBaseType === 'int16'
				? i32load16s()
				: loadOpcode[kind]();

	return saveByteCode(context, [
		...i32const(memoryItem.byteAddress),
		...(memoryItem.isPointingToPointer ? [...i32load(), ...i32load()] : i32load()),
		...finalLoad,
	]);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('pushMemoryPointer', () => {
		it('dereferences double pointers and loads target kind', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						ptr: {
							id: 'ptr',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 12,
							default: 0,
							isInteger: false,
							pointeeBaseType: 'float64',
							isPointingToPointer: true,
							isUnsigned: false,
							type: 'float64**',
						} as never,
					},
				},
			});

			pushMemoryPointer(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('*ptr')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual([...i32const(12), ...i32load(), ...i32load(), ...f64load()]);
			expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: false }]);
		});

		it('dereferences int8* with i32load8s for the final load', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						ptr: {
							id: 'ptr',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 8,
							default: 0,
							isInteger: true,
							pointeeBaseType: 'int8',
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'int8*',
						} as never,
					},
				},
			});

			pushMemoryPointer(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('*ptr')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual([...i32const(8), ...i32load(), ...i32load8s()]);
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});

		it('dereferences int8** with i32load8s for the final load', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						pptr: {
							id: 'pptr',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 4,
							default: 0,
							isInteger: true,
							pointeeBaseType: 'int8',
							isPointingToPointer: true,
							isUnsigned: false,
							type: 'int8**',
						} as never,
					},
				},
			});

			pushMemoryPointer(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('*pptr')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual([...i32const(4), ...i32load(), ...i32load(), ...i32load8s()]);
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});

		it('dereferences int16* with i32load16s for the final load', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						ptr: {
							id: 'ptr',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 8,
							default: 0,
							isInteger: true,
							pointeeBaseType: 'int16',
							isPointingToPointer: false,
							isUnsigned: false,
							type: 'int16*',
						} as never,
					},
				},
			});

			pushMemoryPointer(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('*ptr')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual([...i32const(8), ...i32load(), ...i32load16s()]);
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});

		it('dereferences int16** with i32load16s for the final load', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						pptr: {
							id: 'pptr',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 0,
							wordAlignedSize: 1,
							byteAddress: 4,
							default: 0,
							isInteger: true,
							pointeeBaseType: 'int16',
							isPointingToPointer: true,
							isUnsigned: false,
							type: 'int16**',
						} as never,
					},
				},
			});

			pushMemoryPointer(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('*pptr')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual([...i32const(4), ...i32load(), ...i32load(), ...i32load16s()]);
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});
	});
}
