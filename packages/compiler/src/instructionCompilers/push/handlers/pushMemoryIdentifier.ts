import { ErrorCode, getError } from '../../../errors';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getDataStructure } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';
import i32load from '../../../wasmUtils/load/i32load';
import { kindToStackItem, loadOpcode, resolveMemoryValueKind } from '../shared';

import type { AST, CompilationContext } from '../../../types';

export default function pushMemoryIdentifier(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const memory = context.namespace.memory;
	const memoryItem = getDataStructure(memory, argument.value);

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	const kind = resolveMemoryValueKind(memoryItem);
	context.stack.push(kindToStackItem(kind, { isNonZero: false }));

	return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind]()]);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

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
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'value' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual([...i32const(8), ...i32load()]);
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});
	});
}
