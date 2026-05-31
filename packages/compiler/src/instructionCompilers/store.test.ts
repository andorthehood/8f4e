import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import store from './store';

describe('store instruction compiler', () => {
	it('stores to a safe memory address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeRange: {
						source: 'memory-start',
						memoryIndex: 0,
						byteAddress: 0,
						safeByteLength: 4,
						memoryId: 'test',
					},
				},
			},
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'store',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('stores to an unsafe memory address with a bounds guard', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'store',
				arguments: [],
			} as CompilerASTLine,
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
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeRange: {
						source: 'memory-start',
						memoryIndex: 0,
						byteAddress: 0,
						safeByteLength: 8,
						memoryId: 'test',
					},
				},
			},
			{ kind: 'value', valueType: 'float64', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'store',
				arguments: [],
			} as CompilerASTLine,
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
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeRange: {
						source: 'memory-start',
						memoryIndex: 0,
						byteAddress: 0,
						safeByteLength: 4,
						memoryId: 'test',
					},
				},
			},
			{ kind: 'value', valueType: 'float', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'store',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toContain(56); // F32_STORE opcode
		expect(context.byteCode).not.toContain(57); // no F64_STORE
	});

	it('emits f64.store for float64 value at unsafe address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'float64', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 5,
				lineNumberAfterMacroExpansion: 5,
				instruction: 'store',
				arguments: [],
			} as CompilerASTLine,
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
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeAccessByteWidth: 4,
				},
			},
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			store,
			{
				lineNumberBeforeMacroExpansion: 6,
				lineNumberAfterMacroExpansion: 6,
				instruction: 'store',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).not.toContain(WASM_MEMORY_SIZE);
	});
});
