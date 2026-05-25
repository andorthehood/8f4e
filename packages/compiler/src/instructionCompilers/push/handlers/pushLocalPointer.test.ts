import { f32load, localGet, WASM_TYPE_F32 } from '@8f4e/compiler-wasm-utils';
import { describe, it } from 'vitest';

import pushLocalPointer from './pushLocalPointer';

import createInstructionCompilerTestContext, { expectGuardedDereference } from '../../../utils/testUtils';

import type { PushIdentifierLine } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushLocalPointer', () => {
	it('dereferences a local pointer via a guarded load', () => {
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

		expectGuardedDereference(context.byteCode, {
			prefix: localGet(1),
			finalLoad: f32load(),
			guardCount: 1,
			resultType: WASM_TYPE_F32,
		});
	});
});
