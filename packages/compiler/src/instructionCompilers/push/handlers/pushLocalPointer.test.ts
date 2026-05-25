import { f32load, localGet, WASM_TYPE_F32 } from '@8f4e/compiler-wasm-utils';
import { describe, it } from 'vitest';

import pushLocalPointer from './pushLocalPointer';

import createInstructionCompilerTestContext, { expectGuardedDereference } from '../../../utils/testUtils';

import type { ResolvedLocalPointerPushLine } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushLocalPointer', () => {
	it('dereferences a local pointer via a guarded load', () => {
		const local = { isInteger: true, pointeeBaseType: 'float' as const, index: 1 };
		const context = createInstructionCompilerTestContext({
			locals: {
				lut: local,
			},
		});

		pushLocalPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*lut')],
				resolvedTarget: { kind: 'local-pointer', local },
			} as ResolvedLocalPointerPushLine,
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
