import { describe, expect, test } from 'vitest';

import compile from '../src';

describe('argument continuation lines', () => {
	test('compile resolves a split intermodule pointer declaration like the single-line form', () => {
		const split = compile(
			{
				groups: {
					main: [
						{ code: ['module source', 'float[] samples 8 0.0', 'moduleEnd'] },
						{ code: ['module target', 'float*', '- readHead', '- &source:samples', 'moduleEnd'] },
					],
				},
			},
			{ startingMemoryWordAddress: 0 }
		);
		const singleLine = compile(
			{
				groups: {
					main: [
						{ code: ['module source', 'float[] samples 8 0.0', 'moduleEnd'] },
						{ code: ['module target', 'float* readHead &source:samples', 'moduleEnd'] },
					],
				},
			},
			{ startingMemoryWordAddress: 0 }
		);

		const sourceBuffer = split.compiledModules.source.memoryMap.samples;
		const splitPointer = split.compiledModules.target.memoryMap.readHead;
		const singleLinePointer = singleLine.compiledModules.target.memoryMap.readHead;

		expect(splitPointer.default).toBe(sourceBuffer.byteAddress);
		expect(splitPointer).toEqual(singleLinePointer);
	});

	test('compile resolves split-byte hex defaults from continuation lines', () => {
		const split = compile(
			{ groups: { main: [{ code: ['module target', 'int color', '- 0xA8', '- 0xFF', 'moduleEnd'] }] } },
			{
				startingMemoryWordAddress: 0,
			}
		);
		const singleLine = compile(
			{ groups: { main: [{ code: ['module target', 'int color 0xA8 0xFF', 'moduleEnd'] }] } },
			{
				startingMemoryWordAddress: 0,
			}
		);

		expect(split.compiledModules.target.memoryMap.color.default).toBe(0xa8ff0000);
		expect(split.compiledModules.target.memoryMap.color).toEqual(singleLine.compiledModules.target.memoryMap.color);
	});

	test('compile accepts negative literals from continuation lines after stack instructions', () => {
		expect(() =>
			compile(
				{ groups: { main: [{ code: ['module target', 'push', '- -1', 'drop', 'moduleEnd'] }] } },
				{
					startingMemoryWordAddress: 0,
				}
			)
		).not.toThrow();
	});
});
