import extractElementCountBase from '../../../syntax/extractElementCountBase';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import { getElementCount } from '../../../utils/memoryData';
import i32const from '../../../wasmUtils/const/i32const';

import type { AST, CompilationContext } from '../../../types';

export default function pushElementCount(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const base = extractElementCountBase(argument.value);
	context.stack.push({ isInteger: true, isNonZero: true });
	return saveByteCode(context, i32const(getElementCount(context.namespace.memory, base)));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushElementCount', () => {
		it('pushes element count from $identifier', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					memory: {
						buffer: {
							id: 'buffer',
							numberOfElements: 16,
							elementWordSize: 2,
							wordAlignedAddress: 0,
							wordAlignedSize: 8,
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

			pushElementCount(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: '$buffer' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(16));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});
	});
}
