import { i32const, i32load } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { getDataStructure } from '../../../utils/memoryData';
import { kindToStackItem, loadOpcode, resolveMemoryValueKind } from '../shared';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

export default function pushMemoryIdentifier(
	line: PushIdentifierLine,
	context: CompilationContext
): CompilationContext {
	const memory = context.namespace.memory;
	const memoryItem = getDataStructure(memory, line.arguments[0].value)!;

	const kind = resolveMemoryValueKind(memoryItem);
	context.stack.push(kindToStackItem(kind, { isNonZero: false }));

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind]()]);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('pushMemoryIdentifier', () => {
		it('loads memory value at byteAddress', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						value: {
							id: 'value',
							numberOfElements: 1,
							elementWordSize: 4,
							wordAlignedAddress: 2,
							wordAlignedSize: 1,
							byteAddress: 8,
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

			pushMemoryIdentifier(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('value')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual([...i32const(8), ...i32load()]);
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});
	});
}
