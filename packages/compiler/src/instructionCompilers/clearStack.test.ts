import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import clearStack from './clearStack';

describe('clearStack instruction compiler', () => {
	it('drops all stack values', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'float', isNonZero: true }
		);

		analyzeAndCompileInstruction(
			clearStack,
			{
				lineNumber: 1,
				instruction: 'clearStack',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
