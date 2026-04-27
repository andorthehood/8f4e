import { i32const, i32load } from '@8f4e/compiler-wasm-utils';
import { WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import pushMemoryPointerEndAddress from './pushMemoryPointerEndAddress';

import createInstructionCompilerTestContext from '../../../utils/testUtils';

import type { PushIdentifierLine } from '../../../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushMemoryPointerEndAddress', () => {
	it('emits load of pointer value with zero offset for int* (offset=0)', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 2,
						wordAlignedSize: 1,
						byteAddress: 8,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int',
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int*',
					} as never,
				},
			},
		});

		pushMemoryPointerEndAddress(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*ptr&')],
			} as PushIdentifierLine,
			context
		);

		// offset = (ceil(4/4) - 1) * 4 = 0 → no i32.add
		expect(context.byteCode).toEqual([...i32const(8), ...i32load()]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});

	it('emits load + offset for float64* (offset=4)', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					fptr: {
						id: 'fptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 0,
						wordAlignedSize: 1,
						byteAddress: 4,
						default: 0,
						isInteger: false,
						isFloat64: false,
						pointeeBaseType: 'float64',
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'float64*',
					} as never,
				},
			},
		});

		pushMemoryPointerEndAddress(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*fptr&')],
			} as PushIdentifierLine,
			context
		);

		// offset = (ceil(8/4) - 1) * 4 = 4 → i32.add
		expect(context.byteCode).toEqual([...i32const(4), ...i32load(), ...i32const(4), WASMInstruction.I32_ADD]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});

	it('emits load of pointer value with zero offset for int8* (offset=0)', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					ptr: {
						id: 'ptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 1,
						wordAlignedSize: 1,
						byteAddress: 4,
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

		pushMemoryPointerEndAddress(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*ptr&')],
			} as PushIdentifierLine,
			context
		);

		// offset = (ceil(1/4) - 1) * 4 = 0 → no i32.add
		expect(context.byteCode).toEqual([...i32const(4), ...i32load()]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});

	it('emits load of pointer value with zero offset for float* (offset=0)', () => {
		const context = createInstructionCompilerTestContext({
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				memory: {
					fptr: {
						id: 'fptr',
						numberOfElements: 1,
						elementWordSize: 4,
						wordAlignedAddress: 1,
						wordAlignedSize: 1,
						byteAddress: 4,
						default: 0,
						isInteger: false,
						pointeeBaseType: 'float',
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'float*',
					} as never,
				},
			},
		});

		pushMemoryPointerEndAddress(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*fptr&')],
			} as PushIdentifierLine,
			context
		);

		expect(context.byteCode).toEqual([...i32const(4), ...i32load()]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});

	it('emits load of pointer value with zero offset for int** (offset=0)', () => {
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
						byteAddress: 0,
						default: 0,
						isInteger: true,
						pointeeBaseType: 'int',
						isPointingToPointer: true,
						isUnsigned: false,
						type: 'int**',
					} as never,
				},
			},
		});

		pushMemoryPointerEndAddress(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('*pptr&')],
			} as PushIdentifierLine,
			context
		);

		// pointee is int* (4 bytes = 1 word slot) → offset = 0
		expect(context.byteCode).toEqual([...i32const(0), ...i32load()]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});
});
