import { extractMemoryReferenceBase } from '@8f4e/tokenizer';
import { hasMemoryReferencePrefixStart } from '@8f4e/tokenizer';

import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getDataStructureByteAddress, getMemoryStringLastByteAddress } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

export default function pushMemoryReference(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
	const memory = context.namespace.memory;
	const reference = line.arguments[0].value;
	const base = extractMemoryReferenceBase(reference);
	let value = 0;

	if (hasMemoryReferencePrefixStart(reference)) {
		value = getDataStructureByteAddress(memory, base);
	} else {
		value = getMemoryStringLastByteAddress(memory, base);
	}

	context.stack.push({ isInteger: true, isNonZero: value !== 0, isSafeMemoryAddress: true });
	return saveByteCode(context, i32const(value));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushMemoryReference', () => {
		it('pushes start address for &name and marks safe address', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 4,
							elementWordSize: 4,
							wordAlignedAddress: 3,
							wordAlignedSize: 4,
							byteAddress: 12,
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

			pushMemoryReference(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: '&buffer' }],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual(i32const(12));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, isSafeMemoryAddress: true }]);
		});

		it('pushes end-word base address for name&', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 4,
							elementWordSize: 4,
							wordAlignedAddress: 3,
							wordAlignedSize: 4,
							byteAddress: 12,
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

			pushMemoryReference(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'buffer&' }],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual(i32const(24));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, isSafeMemoryAddress: true }]);
		});
	});
}
