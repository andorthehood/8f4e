import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import createInstructionCompilerTestContext from '../../utils/testUtils';
import float64 from './float64';
import int from './int';
import { applyPlannedMemoryDeclaration, getTestMemoryMap, prepareMemoryDeclarationPlan } from './testUtils';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('float64 instruction compiler', () => {
	it('creates a float64 memory entry', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			float64,
			{
				lineNumber: 1,
				instruction: 'float64',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('value')],
			} satisfies MemoryDeclarationLine,
			context
		);

		expect(getTestMemoryMap(context)).toMatchSnapshot();
	});

	it('float64 scalar has elementWordSize 8', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			float64,
			{
				lineNumber: 1,
				instruction: 'float64',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('value')],
			} satisfies MemoryDeclarationLine,
			context
		);

		expect(getTestMemoryMap(context)['value'].elementWordSize).toBe(8);
	});

	it('float64 at offset 0 has byteAddress divisible by 8', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			float64,
			{
				lineNumber: 1,
				instruction: 'float64',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('value')],
			} satisfies MemoryDeclarationLine,
			context
		);

		expect(getTestMemoryMap(context)['value'].byteAddress % 8).toBe(0);
	});

	it('aligns second float64 to 8 bytes after odd number of int32 vars', () => {
		const context = createInstructionCompilerTestContext();
		const firstFloat64 = {
			lineNumber: 1,
			instruction: 'float64',
			hasExplicitMemoryDefault: false,
			arguments: [classifyIdentifier('a')],
		} satisfies MemoryDeclarationLine;
		const firstInt = {
			lineNumber: 2,
			instruction: 'int',
			hasExplicitMemoryDefault: false,
			arguments: [classifyIdentifier('x')],
		} satisfies MemoryDeclarationLine;
		const secondInt = {
			lineNumber: 3,
			instruction: 'int',
			hasExplicitMemoryDefault: false,
			arguments: [classifyIdentifier('y')],
		} satisfies MemoryDeclarationLine;
		const thirdInt = {
			lineNumber: 4,
			instruction: 'int',
			hasExplicitMemoryDefault: false,
			arguments: [classifyIdentifier('z')],
		} satisfies MemoryDeclarationLine;
		const secondFloat64 = {
			lineNumber: 5,
			instruction: 'float64',
			hasExplicitMemoryDefault: false,
			arguments: [classifyIdentifier('b')],
		} satisfies MemoryDeclarationLine;
		prepareMemoryDeclarationPlan(context, [firstFloat64, firstInt, secondInt, thirdInt, secondFloat64]);

		// First float64 (starts at word 0, even)
		applyPlannedMemoryDeclaration(float64, firstFloat64, context);

		// Three int32 variables (odd count) push the offset to an odd word boundary
		applyPlannedMemoryDeclaration(int, firstInt, context);
		applyPlannedMemoryDeclaration(int, secondInt, context);
		applyPlannedMemoryDeclaration(int, thirdInt, context);

		// Second float64 must still be 8-byte aligned despite odd preceding offset
		applyPlannedMemoryDeclaration(float64, secondFloat64, context);

		const entry = getTestMemoryMap(context)['b'];
		expect(entry.byteAddress % 8).toBe(0);
		expect(entry.wordAlignedAddress % 2).toBe(0);
	});

	it('creates a float64* memory entry with pointer-width allocation', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			float64,
			{
				lineNumber: 1,
				instruction: 'float64*',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('ptr')],
			} satisfies MemoryDeclarationLine,
			context
		);

		const entry = getTestMemoryMap(context)['ptr'];
		expect(entry.elementWordSize).toBe(4);
		expect(entry.wordAlignedSize).toBe(1);
		expect(entry.pointeeBaseType).toBe('float64');
		expect(entry.isInteger).toBe(true);
	});

	it('creates a float64** memory entry with pointer-width allocation', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			float64,
			{
				lineNumber: 1,
				instruction: 'float64**',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('pptr')],
			} satisfies MemoryDeclarationLine,
			context
		);

		const entry = getTestMemoryMap(context)['pptr'];
		expect(entry.elementWordSize).toBe(4);
		expect(entry.wordAlignedSize).toBe(1);
		expect(entry.pointeeBaseType).toBe('float64');
		expect(entry.pointerDepth).toBe(2);
	});
});
