import type { ResolvedLocalPointerPushLine } from '@8f4e/compiler-spec';
import { f32load, i32load8u, localGet, WASM_TYPE_F32, WASM_TYPE_I32 } from '@8f4e/compiler-wasm-utils';
import { describe, it } from 'vitest';

import createInstructionCompilerTestContext, { expectGuardedDereference } from '../../../utils/testUtils';
import pushLocalPointer from './pushLocalPointer';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushLocalPointer', () => {
	it('dereferences a local pointer via a guarded load', () => {
		const local = { kind: 'value', valueType: 'int', pointeeBaseType: 'float' as const, pointerDepth: 1, index: 1 };
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

	it('dereferences an unsigned int8 local pointer via an unsigned guarded load', () => {
		const local = { kind: 'value', valueType: 'int', pointeeBaseType: 'int8u' as const, pointerDepth: 1, index: 1 };
		const context = createInstructionCompilerTestContext({
			locals: {
				bytes: local,
			},
		});

		pushLocalPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*bytes')],
				resolvedTarget: { kind: 'local-pointer', local },
			} as ResolvedLocalPointerPushLine,
			context
		);

		expectGuardedDereference(context.byteCode, {
			prefix: localGet(1),
			finalLoad: i32load8u(),
			guardCount: 1,
			resultType: WASM_TYPE_I32,
		});
	});
});
