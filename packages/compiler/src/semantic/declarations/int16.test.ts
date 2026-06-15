import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../../utils/testUtils';
import int16 from './int16';
import { applyPlannedMemoryDeclaration } from './testUtils';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('int16 instruction compiler', () => {
	it('creates an int16* memory entry with pointer-width allocation', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			int16,
			{
				lineNumber: 1,
				instruction: 'int16*',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('ptr')],
			} satisfies MemoryDeclarationLine,
			context
		);

		const entry = context.namespace.memory['ptr'];
		expect(entry.elementWordSize).toBe(4);
		expect(entry.wordAlignedSize).toBe(1);
		expect(entry.isInteger).toBe(true);
		expect(entry.pointeeBaseType).toBe('int16');
		expect(entry.pointerDepth).toBe(1);
	});

	it('creates an int16** memory entry with pointer-width allocation', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			int16,
			{
				lineNumber: 1,
				instruction: 'int16**',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('pptr')],
			} satisfies MemoryDeclarationLine,
			context
		);

		const entry = context.namespace.memory['pptr'];
		expect(entry.elementWordSize).toBe(4);
		expect(entry.wordAlignedSize).toBe(1);
		expect(entry.isInteger).toBe(true);
		expect(entry.pointeeBaseType).toBe('int16');
		expect(entry.pointerDepth).toBe(2);
	});

	it('stores 4 bytes (pointer slot) regardless of int16 pointee width', () => {
		const context = createInstructionCompilerTestContext();

		applyPlannedMemoryDeclaration(
			int16,
			{
				lineNumber: 1,
				instruction: 'int16*',
				hasExplicitMemoryDefault: false,
				arguments: [classifyIdentifier('p')],
			} satisfies MemoryDeclarationLine,
			context
		);

		// Pointer slot always occupies 1 word (4 bytes)
		expect(context.namespace.memory['p'].wordAlignedSize).toBe(1);
		expect(context.namespace.memory['p'].elementWordSize).toBe(4);
	});
});
