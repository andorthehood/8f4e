import type { ResolvedLocalSetLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import _localSet from './localSet';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('localSet instruction compiler', () => {
	it('stores a local value', () => {
		const local = { isInteger: true, index: 0 };
		const context = createInstructionCompilerTestContext({
			locals: {
				0: local,
			},
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			_localSet,
			{
				lineNumber: 1,
				instruction: 'localSet',
				arguments: [classifyIdentifier('value')],
				binding: { id: 0, name: 'value', type: 'int' },
			} as ResolvedLocalSetLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
