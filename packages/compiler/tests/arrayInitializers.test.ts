import { describe, expect, test } from 'vitest';

import compile from '../src';

function createMemory(requiredMemoryBytes: number): WebAssembly.Memory {
	const pageSize = 64 * 1024;
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / pageSize));
	return new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
}

describe('array declaration inline initializer internals', () => {
	test('does not emit full passive data images for large sparse array initializers', () => {
		const result = compile(
			{
				entries: {
					main: [
						{
							code: ['module test', 'int[] huge 1000000 1', 'moduleEnd'],
						},
					],
				},
			},
			{ disableSharedMemory: true }
		);

		expect(result.codeBuffer.byteLength).toBeLessThan(10_000);
	});

	test('initDefaults clears implicit arrays before restoring passive data defaults', async () => {
		const result = compile(
			{
				entries: {
					main: [
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
				},
			},
			{ disableSharedMemory: true }
		);
		const memoryRef = createMemory(result.requiredMemoryBytes);
		const memory = new Int32Array(memoryRef.buffer);
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			host: { memory: memoryRef },
		});
		const initDefaults = instance.exports.initDefaults as () => void;
		const main = instance.exports.main as () => void;
		const scratch = result.compiledModules.test.memoryMap.scratch;
		const marker = result.compiledModules.test.memoryMap.marker;

		initDefaults();
		expect(memory[scratch.wordAlignedAddress]).toBe(0);
		expect(memory[marker.wordAlignedAddress]).toBe(123);

		main();
		expect(memory[scratch.wordAlignedAddress]).toBe(99);
		expect(memory[marker.wordAlignedAddress]).toBe(456);

		initDefaults();
		expect(memory[scratch.wordAlignedAddress]).toBe(0);
		expect(memory[marker.wordAlignedAddress]).toBe(123);
	});
});
