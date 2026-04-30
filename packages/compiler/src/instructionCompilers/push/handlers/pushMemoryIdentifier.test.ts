import { i32const, i32load } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import pushMemoryIdentifier from './pushMemoryIdentifier';

import createInstructionCompilerTestContext from '../../../utils/testUtils';

import type { PushIdentifierLine } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

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
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int',
					} as never,
				},
			},
		});

		pushMemoryIdentifier(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('value')],
			} as PushIdentifierLine,
			context
		);

		expect(context.byteCode).toEqual([...i32const(8), ...i32load()]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});
});
