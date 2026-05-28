import { describe, expect, test } from 'vitest';

import compile from '../src';

describe('argument continuation lines', () => {
	test('compile resolves a split intermodule pointer declaration like the single-line form', () => {
		const split = compile(
			[
				{ code: ['module allpassDiffuser', 'float[] buffer 8 0.0', 'moduleEnd'] },
				{ code: ['module target', 'float*', '- buffer', '- &allpassDiffuser:buffer', 'moduleEnd'] },
			],
			{ startingMemoryWordAddress: 0 }
		);
		const singleLine = compile(
			[
				{ code: ['module allpassDiffuser', 'float[] buffer 8 0.0', 'moduleEnd'] },
				{ code: ['module target', 'float* buffer &allpassDiffuser:buffer', 'moduleEnd'] },
			],
			{ startingMemoryWordAddress: 0 }
		);

		const sourceBuffer = split.compiledModules.allpassDiffuser.memoryMap.buffer;
		const splitPointer = split.compiledModules.target.memoryMap.buffer;
		const singleLinePointer = singleLine.compiledModules.target.memoryMap.buffer;

		expect(splitPointer.default).toBe(sourceBuffer.byteAddress);
		expect(splitPointer).toEqual(singleLinePointer);
	});

	test('compile accepts continuation after a stack instruction', () => {
		expect(() =>
			compile([{ code: ['module target', 'push', '- 1', 'drop', 'moduleEnd'] }], {
				startingMemoryWordAddress: 0,
			})
		).not.toThrow();
	});
});
