import extractMemoryReferenceBase from '../../../syntax/extractMemoryReferenceBase';
import hasMemoryReferencePrefixStart from '../../../syntax/hasMemoryReferencePrefixStart';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getDataStructureByteAddress, getMemoryStringLastByteAddress } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';

import type { AST, CompilationContext } from '../../../types';

export default function pushMemoryReference(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const memory = context.namespace.memory;
	const base = extractMemoryReferenceBase(argument.value);
	let value = 0;

	if (hasMemoryReferencePrefixStart(argument.value)) {
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
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: '&buffer' }],
				} as AST[number],
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
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'buffer&' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(24));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, isSafeMemoryAddress: true }]);
		});
	});
}
