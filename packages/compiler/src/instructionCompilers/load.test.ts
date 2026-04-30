import { describe, expect, it } from 'vitest';
import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import load from './load';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('load instruction compiler', () => {
	it('loads from a safe memory address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 4, memoryId: 'test' },
		});

		load(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'load',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('loads from an unsafe memory address with a bounds guard', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
		});

		load(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'load8u',
				arguments: [],
			} as AST[number],
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
			isInteger: true,
			isNonZero: false,
			memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 2, memoryId: 'test' },
		});

		load(
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'load',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toContain(WASMInstruction.MEMORY_SIZE);
	});
});
