import { localGet } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import pushLocal from './pushLocal';

import createInstructionCompilerTestContext from '../../../utils/testUtils';

import type { PushIdentifierLine } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushLocal', () => {
	it('pushes a local via local.get', () => {
		const context = createInstructionCompilerTestContext({
			locals: {
				temp: { isInteger: true, index: 3 },
			},
		});

		pushLocal(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('temp')],
			} as PushIdentifierLine,
			context
		);

		expect(context.byteCode).toEqual(localGet(3));
	});
});
