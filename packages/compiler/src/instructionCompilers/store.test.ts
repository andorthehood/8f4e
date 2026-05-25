import { describe, expect, it } from 'vitest';
import { WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';
import { ErrorCode } from '@8f4e/compiler-spec';

import store from './store';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('store instruction compiler', () => {
	const pointerSlotAddress = {
		isInteger: true,
		isNonZero: false,
		knownIntegerValue: 0,
		address: {
			safeRange: {
				source: 'memory-start' as const,
				memoryIndex: 0,
				byteAddress: 0,
				safeByteLength: 4,
				memoryId: 'ptr',
			},
		},
	};
	const pointerNamespace = {
		...createInstructionCompilerTestContext().namespace,
		memory: {
			ptr: {
				id: 'ptr',
				numberOfElements: 1,
				elementWordSize: 4,
				wordAlignedAddress: 0,
				wordAlignedSize: 1,
				byteAddress: 0,
				default: 0,
				isInteger: true,
				pointeeBaseType: 'int',
				isPointingToPointer: false,
				isUnsigned: false,
				type: 'int*',
				memoryIndex: 0,
			} as never,
		},
	};

	it('stores to a safe memory address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 4, memoryId: 'test' },
				},
			},
			{ isInteger: true, isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('stores to an unsafe memory address with a bounds guard', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits f64.store (opcode 57) for float64 value at safe address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 8, memoryId: 'test' },
				},
			},
			{ isInteger: false, isFloat64: true, isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toContain(57); // F64_STORE opcode
		expect(context.byteCode).not.toContain(56); // no F32_STORE
		expect(context.byteCode).not.toContain(54); // no I32_STORE
		expect(context.stack).toHaveLength(0);
	});

	it('emits f32.store (opcode 56) for float32 value at safe address, not f64.store', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 4, memoryId: 'test' },
				},
			},
			{ isInteger: false, isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toContain(56); // F32_STORE opcode
		expect(context.byteCode).not.toContain(57); // no F64_STORE
	});

	it('emits f64.store for float64 value at unsafe address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: false, isFloat64: true, isNonZero: false });

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 5,
				lineNumberAfterMacroExpansion: 5,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toContain(57); // F64_STORE opcode
		expect(context.byteCode).not.toContain(56); // no F32_STORE
		expect(context.stack).toHaveLength(0);
	});

	it('does not guard when an explicit clamp proves the access width is safe', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				address: {
					safeAccessByteWidth: 4,
				},
			},
			{ isInteger: true, isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 6,
				lineNumberAfterMacroExpansion: 6,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).not.toContain(WASM_MEMORY_SIZE);
	});

	it('stores a known in-bounds pointer value without a value guard', () => {
		const context = createInstructionCompilerTestContext({
			namespace: pointerNamespace,
		});
		context.stack.push(pointerSlotAddress, { isInteger: true, isNonZero: true, knownIntegerValue: 10 });

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 7,
				lineNumberAfterMacroExpansion: 7,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).not.toContain(WASM_MEMORY_SIZE);
	});

	it('throws for a known out-of-bounds pointer value', () => {
		const context = createInstructionCompilerTestContext({
			namespace: pointerNamespace,
		});
		context.stack.push(pointerSlotAddress, { isInteger: true, isNonZero: true, knownIntegerValue: -1 });

		expect(() =>
			analyzeAndCompileInstruction(
				store,
				{
					lineNumberBeforeMacroExpansion: 8,
					lineNumberAfterMacroExpansion: 8,
					instruction: 'store',
					arguments: [],
				} as AST[number],
				context
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_POINTER_ADDRESS }));
	});

	it('guards an unproven pointer value before storing into a pointer slot', () => {
		const context = createInstructionCompilerTestContext({
			namespace: pointerNamespace,
		});
		context.stack.push(pointerSlotAddress, { isInteger: true, isNonZero: false });

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 9,
				lineNumberAfterMacroExpansion: 9,
				instruction: 'store',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toContain(WASM_MEMORY_SIZE);
	});
});
