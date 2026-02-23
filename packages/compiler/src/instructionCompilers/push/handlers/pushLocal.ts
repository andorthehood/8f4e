import { ErrorCode, getError } from '../../../errors';
import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import localGet from '../../../wasmUtils/local/localGet';

import type { AST, CompilationContext } from '../../../types';

export default function pushLocal(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const local = context.namespace.locals[argument.value];

	if (!local) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	context.stack.push({ isInteger: local.isInteger, isNonZero: false });
	return saveByteCode(context, localGet(local.index));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushLocal', () => {
		it('pushes a local via local.get', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					locals: {
						temp: { isInteger: true, index: 3 },
					},
				},
			});

			pushLocal(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'temp' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(localGet(3));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});
	});
}
