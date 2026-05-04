import { describe, expect, test } from 'vitest';

import { createWasmInstance } from './instructions/testUtils';

import compile from '../src';

describe('array declaration inline initializers', () => {
	test('initializes int[] elements from trailing declaration values', async () => {
		const result = compile(
			[
				{
					code: ['module test', 'int[] notes 10 48 50 53', 'moduleEnd'],
				},
			],
			{ disableSharedMemory: true }
		);
		const { init, memory } = await createWasmInstance(result.codeBuffer);
		const notes = result.compiledModules.test.memoryMap.notes;
		const start = notes.wordAlignedAddress;

		init();

		expect(memory[start]).toBe(48);
		expect(memory[start + 1]).toBe(50);
		expect(memory[start + 2]).toBe(53);
		expect(memory[start + 3]).toBe(0);
	});

	test('resolves constants and compile-time expressions in initializer values', async () => {
		const result = compile(
			[
				{
					code: ['module test', 'const ROOT 48', 'int[] notes 4 ROOT ROOT+2 ROOT+5', 'moduleEnd'],
				},
			],
			{ disableSharedMemory: true }
		);
		const { init, memory } = await createWasmInstance(result.codeBuffer);
		const notes = result.compiledModules.test.memoryMap.notes;
		const start = notes.wordAlignedAddress;

		init();

		expect(memory[start]).toBe(48);
		expect(memory[start + 1]).toBe(50);
		expect(memory[start + 2]).toBe(53);
	});

	test('supports hexadecimal initializer values', async () => {
		const result = compile(
			[
				{
					code: ['module test', 'int[] foo 2 0x01 0x02', 'moduleEnd'],
				},
			],
			{ disableSharedMemory: true }
		);
		const { init, memory } = await createWasmInstance(result.codeBuffer);
		const foo = result.compiledModules.test.memoryMap.foo;
		const start = foo.wordAlignedAddress;

		init();

		expect(memory[start]).toBe(1);
		expect(memory[start + 1]).toBe(2);
	});

	test('uses narrow stores for int8[] and int16[] initializer values', async () => {
		const result = compile(
			[
				{
					code: ['module test', 'int8[] bytes 4 1 2 3 4', 'int16[] shorts 3 1000 2000 3000', 'moduleEnd'],
				},
			],
			{ disableSharedMemory: true }
		);
		const { init, memory } = await createWasmInstance(result.codeBuffer);
		const bytes = result.compiledModules.test.memoryMap.bytes;
		const shorts = result.compiledModules.test.memoryMap.shorts;
		const byteView = new Uint8Array(memory.buffer);
		const dataView = new DataView(memory.buffer);

		init();

		expect([...byteView.slice(bytes.byteAddress, bytes.byteAddress + 4)]).toEqual([1, 2, 3, 4]);
		expect(dataView.getInt16(shorts.byteAddress, true)).toBe(1000);
		expect(dataView.getInt16(shorts.byteAddress + 2, true)).toBe(2000);
		expect(dataView.getInt16(shorts.byteAddress + 4, true)).toBe(3000);
	});

	test('init clears implicit arrays before restoring passive data defaults', async () => {
		const result = compile(
			[
				{
					code: [
						'module test',
						'int[] scratch 4',
						'int marker 123',
						'loop',
						'push &scratch',
						'push 99',
						'store',
						'push &marker',
						'push 456',
						'store',
						'loopEnd',
						'moduleEnd',
					],
				},
			],
			{ disableSharedMemory: true }
		);
		const { init, cycle, memory } = await createWasmInstance(result.codeBuffer);
		const scratch = result.compiledModules.test.memoryMap.scratch;
		const marker = result.compiledModules.test.memoryMap.marker;

		init();
		expect(memory[scratch.wordAlignedAddress]).toBe(0);
		expect(memory[marker.wordAlignedAddress]).toBe(123);

		cycle();
		expect(memory[scratch.wordAlignedAddress]).toBe(99);
		expect(memory[marker.wordAlignedAddress]).toBe(456);

		init();
		expect(memory[scratch.wordAlignedAddress]).toBe(0);
		expect(memory[marker.wordAlignedAddress]).toBe(123);
	});
});
