import { describe, it, expect } from 'vitest';

import compile from '../src/index';

import type { Module } from '../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	memorySizeBytes: 65536,
	includeAST: false,
};

describe('buffer& end address in declaration initializers', () => {
	it('should resolve &buffer to start address in initializers', () => {
		const modules: Module[] = [
			{
				code: ['module test', '', 'int[] buffer 5 0', 'int* startPtr &buffer', '', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		const memoryMap = result.compiledModules.test.memoryMap;

		// buffer should be at byteAddress 4, size 5 words (startingMemoryWordAddress = 1)
		expect(memoryMap.buffer.byteAddress).toBe(4);
		expect(memoryMap.buffer.wordAlignedSize).toBe(5);

		// startPtr should have default value = buffer start = 4
		expect(memoryMap.startPtr.default).toBe(4);
	});

	it('should resolve buffer& to end address in initializers', () => {
		const modules: Module[] = [
			{
				code: ['module test', '', 'int[] buffer 5 0', 'int* endPtr buffer&', '', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		const memoryMap = result.compiledModules.test.memoryMap;

		// buffer should be at byteAddress 4, size 5 words (20 bytes total)
		expect(memoryMap.buffer.byteAddress).toBe(4);
		expect(memoryMap.buffer.wordAlignedSize).toBe(5);

		// endPtr should have default value = buffer end = 4 + (5-1) * 4 = 20
		expect(memoryMap.endPtr.default).toBe(20);
	});

	it('should correctly handle both &buffer and buffer& in same module', () => {
		const modules: Module[] = [
			{
				code: ['module test', '', 'int[] buffer 5 0', 'int* startPtr &buffer', 'int* endPtr buffer&', '', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		const memoryMap = result.compiledModules.test.memoryMap;

		// buffer should be at byteAddress 4, size 5 words (20 bytes total)
		expect(memoryMap.buffer.byteAddress).toBe(4);
		expect(memoryMap.buffer.wordAlignedSize).toBe(5);

		// startPtr should point to buffer start = 4
		expect(memoryMap.startPtr.default).toBe(4);

		// endPtr should point to buffer end = 4 + (5-1) * 4 = 20
		expect(memoryMap.endPtr.default).toBe(20);
	});
});
