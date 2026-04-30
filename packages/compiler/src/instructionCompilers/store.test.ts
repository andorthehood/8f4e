import { describe, expect, it } from 'vitest';

import store from './store';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('store instruction compiler', () => {
	it('stores to a safe memory address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 4, memoryId: 'test' },
			},
			{ isInteger: true, isNonZero: false }
		);

		store(
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

	it('stores to an unsafe memory address without extra bounds checks', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		store(
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
				memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 8, memoryId: 'test' },
			},
			{ isInteger: false, isFloat64: true, isNonZero: false }
		);

		store(
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
				memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 4, memoryId: 'test' },
			},
			{ isInteger: false, isNonZero: false }
		);

		store(
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

		store(
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
});
