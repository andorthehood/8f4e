import {
	f64load,
	i32const,
	i32load,
	i32load16s,
	i32load8s,
	WASM_TYPE_F64,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import { describe, it } from 'vitest';

import pushMemoryPointer from './pushMemoryPointer';

import createInstructionCompilerTestContext, { expectGuardedDereference } from '../../../utils/testUtils';

import type { PushIdentifierLine } from '@8f4e/compiler-spec';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushMemoryPointer', () => {
	it('dereferences double pointers and loads target kind', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 12,
						default: 0,
						isInteger: false,
						pointeeBaseType: 'float64',
						isPointingToPointer: true,
						isUnsigned: false,
						type: 'float64**',
					} as never,
				},
			},
		});

		pushMemoryPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*ptr')],
			} as PushIdentifierLine,
			context
		);

		expectGuardedDereference(context.byteCode, {
			prefix: [...i32const(12), ...i32load()],
			finalLoad: f64load(),
			guardCount: 2,
			resultType: WASM_TYPE_F64,
		});
	});

	it('dereferences int8* with i32load8s for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 8,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int8',
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int8*',
					} as never,
				},
			},
		});

		pushMemoryPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*ptr')],
			} as PushIdentifierLine,
			context
		);

		expectGuardedDereference(context.byteCode, {
			prefix: [...i32const(8), ...i32load()],
			finalLoad: i32load8s(),
			guardCount: 1,
			resultType: WASM_TYPE_I32,
		});
	});

	it('dereferences int8** with i32load8s for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					pptr: {
						id: 'pptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 4,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int8',
						isPointingToPointer: true,
						isUnsigned: false,
						type: 'int8**',
					} as never,
				},
			},
		});

		pushMemoryPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*pptr')],
			} as PushIdentifierLine,
			context
		);

		expectGuardedDereference(context.byteCode, {
			prefix: [...i32const(4), ...i32load()],
			finalLoad: i32load8s(),
			guardCount: 2,
			resultType: WASM_TYPE_I32,
		});
	});

	it('dereferences int16* with i32load16s for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 8,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int16',
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int16*',
					} as never,
				},
			},
		});

		pushMemoryPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*ptr')],
			} as PushIdentifierLine,
			context
		);

		expectGuardedDereference(context.byteCode, {
			prefix: [...i32const(8), ...i32load()],
			finalLoad: i32load16s(),
			guardCount: 1,
			resultType: WASM_TYPE_I32,
		});
	});

	it('dereferences int16** with i32load16s for the final load', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					pptr: {
						id: 'pptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 4,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int16',
						isPointingToPointer: true,
						isUnsigned: false,
						type: 'int16**',
					} as never,
				},
			},
		});

		pushMemoryPointer(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*pptr')],
			} as PushIdentifierLine,
			context
		);

		expectGuardedDereference(context.byteCode, {
			prefix: [...i32const(4), ...i32load()],
			finalLoad: i32load16s(),
			guardCount: 2,
			resultType: WASM_TYPE_I32,
		});
	});
});
