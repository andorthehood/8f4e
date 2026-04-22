import { f32load, localGet } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import pushLocalPointer from './pushLocalPointer';

import createInstructionCompilerTestContext from '../../../utils/testUtils';

import type { PushIdentifierLine } from '../../../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushLocalPointer', () => {
	it('dereferences a local pointer via local.get and a load', () => {
		const context = createInstructionCompilerTestContext({
			locals: {
				lut: { isInteger: true, pointeeBaseType: 'float', index: 1 },
			},
		});

		pushLocalPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*lut')],
			} as PushIdentifierLine,
			context
		);

		expect(context.byteCode).toEqual([...localGet(1), ...f32load()]);
		expect(context.stack).toEqual([{ isInteger: false, isNonZero: false }]);
	});
});
