import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import branchIfUnchanged from './branchIfUnchanged';

describe('branchIfUnchanged instruction compiler', () => {
	it('compiles the unchanged check segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true });

		analyzeAndCompileInstruction(
			branchIfUnchanged,
			{
				lineNumber: 4,
				instruction: 'branchIfUnchanged',
				arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
			memory: context.namespace.memory,
			locals: context.locals,
		}).toMatchSnapshot();
	});
});
