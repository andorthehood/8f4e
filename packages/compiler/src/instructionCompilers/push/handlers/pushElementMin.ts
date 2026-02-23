import { ErrorCode, getError } from '../../../errors';
import extractElementMinBase from '../../../syntax/extractElementMinBase';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getDataStructure, getElementMinValue } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';
import { constOpcode, kindToStackItem, resolveMemoryValueKind } from '../shared';

import type { AST, CompilationContext } from '../../../types';

export default function pushElementMin(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const base = extractElementMinBase(argument.value);
	const memoryItem = getDataStructure(context.namespace.memory, base);

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	const kind = resolveMemoryValueKind(memoryItem);
	const minValue = getElementMinValue(context.namespace.memory, base);
	context.stack.push(kindToStackItem(kind, { isNonZero: minValue !== 0 }));
	return saveByteCode(context, constOpcode[kind](minValue));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushElementMin', () => {
		it('pushes min value for element type', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 4,
							elementWordSize: 2,
							wordAlignedAddress: 0,
							wordAlignedSize: 2,
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

			pushElementMin(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: '!buffer' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(-32768));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});
	});
}
