import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../../utils/testUtils';
import int8u from './int8u';
import { applyPlannedMemoryDeclaration, getTestMemoryMap } from './testUtils';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('int8u instruction compiler', () => {
	it('creates an int8u* memory entry with unsigned pointee metadata', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			int8u,
			{
				lineNumber: 1,
				instruction: 'int8u*',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('ptr')],
			} satisfies MemoryDeclarationLine,
			context
		);

		const entry = getTestMemoryMap(context)['ptr'];
		expect(entry.elementWordSize).toBe(4);
		expect(entry.wordAlignedSize).toBe(1);
		expect(entry.isInteger).toBe(true);
		expect(entry.pointeeBaseType).toBe('int8u');
		expect(entry.pointerDepth).toBe(1);
	});

	it('creates an int8u** memory entry with pointer-width allocation', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			int8u,
			{
				lineNumber: 1,
				instruction: 'int8u**',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('pptr')],
			} satisfies MemoryDeclarationLine,
			context
		);

		const entry = getTestMemoryMap(context)['pptr'];
		expect(entry.elementWordSize).toBe(4);
		expect(entry.wordAlignedSize).toBe(1);
		expect(entry.isInteger).toBe(true);
		expect(entry.pointeeBaseType).toBe('int8u');
		expect(entry.pointerDepth).toBe(2);
	});
});
