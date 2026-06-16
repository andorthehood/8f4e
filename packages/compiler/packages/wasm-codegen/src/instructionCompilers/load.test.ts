import { WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';
import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import load from './load';

describe('load instruction compiler', () => {
	it('loads from a safe memory address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
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
		});

		analyzeAndCompileInstruction(
			load,
			{
				lineNumber: 1,
				instruction: 'load',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('loads from an unsafe memory address with a bounds guard', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			load,
			{
				lineNumber: 2,
				instruction: 'load8u',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('guards when address metadata is shorter than the access width', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: false,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 0,
					safeByteLength: 2,
					memoryId: 'test',
				},
			},
		});

		analyzeAndCompileInstruction(
			load,
			{
				lineNumber: 3,
				instruction: 'load',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toContain(WASM_MEMORY_SIZE);
	});

	it('does not guard when an explicit clamp proves the access width is safe', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: false,
			address: {
				memoryIndex: 0,
				safeAccessByteWidth: 4,
			},
		});

		analyzeAndCompileInstruction(
			load,
			{
				lineNumber: 4,
				instruction: 'load',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).not.toContain(WASM_MEMORY_SIZE);
	});
});
