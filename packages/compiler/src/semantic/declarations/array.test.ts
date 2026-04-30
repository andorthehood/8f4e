import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-types';

import array from './array';

import { ErrorCode } from '../../compilerError';
import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('array declaration compiler', () => {
	it('creates a memory array entry', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int[]',
				arguments: [classifyIdentifier('values'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		expect(context.namespace.memory).toMatchSnapshot();
	});

	it('stores inline initializer values as array defaults', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int[]',
				arguments: [
					classifyIdentifier('notes'),
					{ type: ArgumentType.LITERAL, value: 10, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 48, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 50, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 53, isInteger: true },
				],
			} as AST[number],
			context
		);

		expect(context.namespace.memory['notes'].default).toEqual({
			0: 48,
			1: 50,
			2: 53,
		});
	});

	it('truncates inline initializer values for integer arrays', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int[]',
				arguments: [
					classifyIdentifier('values'),
					{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 1.9, isInteger: false },
				],
			} as AST[number],
			context
		);

		expect(context.namespace.memory['values'].default).toEqual({
			0: 1,
		});
	});

	it('rejects more inline initializer values than array elements', () => {
		const context = createInstructionCompilerTestContext();

		let thrownError: unknown;
		try {
			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int[]',
					arguments: [
						classifyIdentifier('values'),
						{ type: ArgumentType.LITERAL, value: 2, isInteger: true },
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
						{ type: ArgumentType.LITERAL, value: 2, isInteger: true },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);
		} catch (error) {
			thrownError = error;
		}

		expect(thrownError).toMatchObject({ code: ErrorCode.ARRAY_INITIALIZER_TOO_LONG });
	});

	it('creates an int8[] array with correct wordAlignedSize', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int8[]',
				arguments: [classifyIdentifier('bytes'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['bytes'];
		expect(memory.elementWordSize).toBe(1);
		expect(memory.numberOfElements).toBe(3);
		// 3 bytes * 1 byte per element = 3 bytes total
		// ceil(3 / 4) = 1 word
		expect(memory.wordAlignedSize).toBe(1);
	});

	it('creates an int8[] array requiring alignment padding', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int8[]',
				arguments: [classifyIdentifier('bytes'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['bytes'];
		expect(memory.elementWordSize).toBe(1);
		expect(memory.numberOfElements).toBe(5);
		// 5 bytes * 1 byte per element = 5 bytes total
		// ceil(5 / 4) = 2 words
		expect(memory.wordAlignedSize).toBe(2);
	});

	it('creates an int16[] array with correct wordAlignedSize', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int16[]',
				arguments: [classifyIdentifier('shorts'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['shorts'];
		expect(memory.elementWordSize).toBe(2);
		expect(memory.numberOfElements).toBe(3);
		// 3 elements * 2 bytes per element = 6 bytes total
		// ceil(6 / 4) = 2 words
		expect(memory.wordAlignedSize).toBe(2);
	});

	it('creates an int16[] array requiring alignment padding', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int16[]',
				arguments: [classifyIdentifier('shorts'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['shorts'];
		expect(memory.elementWordSize).toBe(2);
		expect(memory.numberOfElements).toBe(5);
		// 5 elements * 2 bytes per element = 10 bytes total
		// ceil(10 / 4) = 3 words
		expect(memory.wordAlignedSize).toBe(3);
	});

	it('creates an int32[] array with correct wordAlignedSize', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int32[]',
				arguments: [classifyIdentifier('ints'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['ints'];
		expect(memory.elementWordSize).toBe(4);
		expect(memory.numberOfElements).toBe(3);
		// 3 elements * 4 bytes per element = 12 bytes total
		// ceil(12 / 4) = 3 words
		expect(memory.wordAlignedSize).toBe(3);
	});

	it('creates an int8u[] array with unsigned flag', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int8u[]',
				arguments: [classifyIdentifier('unsignedBytes'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['unsignedBytes'];
		expect(memory.elementWordSize).toBe(1);
		expect(memory.numberOfElements).toBe(5);
		expect(memory.isUnsigned).toBe(true);
		expect(memory.isInteger).toBe(true);
	});

	it('creates an int16u[] array with unsigned flag', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int16u[]',
				arguments: [classifyIdentifier('unsignedShorts'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['unsignedShorts'];
		expect(memory.elementWordSize).toBe(2);
		expect(memory.numberOfElements).toBe(3);
		expect(memory.isUnsigned).toBe(true);
		expect(memory.isInteger).toBe(true);
	});

	it('creates an int8[] array with isUnsigned false', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int8[]',
				arguments: [classifyIdentifier('signedBytes'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['signedBytes'];
		expect(memory.isUnsigned).toBe(false);
	});

	it('creates a float64[] array with elementWordSize 8', () => {
		const context = createInstructionCompilerTestContext();

		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'float64[]',
				arguments: [classifyIdentifier('doubles'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['doubles'];
		expect(memory.elementWordSize).toBe(8);
		expect(memory.numberOfElements).toBe(3);
		// 3 elements * 8 bytes each = 24 bytes = 6 words
		expect(memory.wordAlignedSize).toBe(6);
		expect(memory.byteAddress % 8).toBe(0);
	});

	it('aligns float64[] to 8 bytes after an odd number of int32 elements', () => {
		const context = createInstructionCompilerTestContext();

		// Three int32 variables to force an odd word offset
		array(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'int[]',
				arguments: [classifyIdentifier('ints'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		array(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'float64[]',
				arguments: [classifyIdentifier('doubles'), { type: ArgumentType.LITERAL, value: 2, isInteger: true }],
			} as AST[number],
			context
		);

		const memory = context.namespace.memory['doubles'];
		expect(memory.byteAddress % 8).toBe(0);
		expect(memory.wordAlignedAddress % 2).toBe(0);
	});
});
