import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import _localSet from './localSet';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('localSet instruction compiler', () => {
	it('stores a local value', () => {
		const local = { isInteger: true, index: 0 };
		const context = createInstructionCompilerTestContext({
			locals: {
				value: local,
			},
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			_localSet,
			{
				lineNumber: 1,
				instruction: 'localSet',
				arguments: [classifyIdentifier('value')],
				local,
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
