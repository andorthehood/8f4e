import { describe, expect, test } from 'vitest';

import compile from '../src';

async function instantiate(codeBuffer: Uint8Array, requiredMemoryBytes: number) {
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / 65536));
	const memory = new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages, shared: false });
	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		js: { memory },
	});
	return { instance, memory };
}

describe('execution groups', () => {
	test('exports each group as an independently callable dispatcher', async () => {
		const result = compile(
			{
				groups: {
					main: [
						{
							code: ['module mainModule', 'int value 0', 'push &value', 'push 1', 'store', 'moduleEnd'],
						},
					],
					aux: [
						{
							code: ['module auxModule', 'int value 0', 'push &value', 'push 2', 'store', 'moduleEnd'],
						},
					],
				},
			},
			{ startingMemoryWordAddress: 1, disableSharedMemory: true }
		);
		const { instance, memory } = await instantiate(result.codeBuffer, result.requiredMemoryBytes);
		const view = new DataView(memory.buffer);
		const mainAddress = result.compiledModules.mainModule.memoryMap.value.byteAddress;
		const auxAddress = result.compiledModules.auxModule.memoryMap.value.byteAddress;

		expect(instance.exports.cycle).toBeUndefined();
		expect(instance.exports.initOnly).toBeUndefined();
		expect(instance.exports.runTests).toBeUndefined();
		expect(instance.exports.main).toEqual(expect.any(Function));
		expect(instance.exports.aux).toEqual(expect.any(Function));

		(instance.exports.initDefaults as CallableFunction)();
		expect(view.getInt32(mainAddress, true)).toBe(0);
		expect(view.getInt32(auxAddress, true)).toBe(0);

		(instance.exports.main as CallableFunction)();
		expect(view.getInt32(mainAddress, true)).toBe(1);
		expect(view.getInt32(auxAddress, true)).toBe(0);

		(instance.exports.aux as CallableFunction)();
		expect(view.getInt32(mainAddress, true)).toBe(1);
		expect(view.getInt32(auxAddress, true)).toBe(2);
	});

	test('initDefaults does not execute user-authored init groups', async () => {
		const result = compile(
			{
				groups: {
					init: [
						{
							code: ['module setup', 'int value 0', 'push &value', 'push 7', 'store', 'moduleEnd'],
						},
					],
				},
			},
			{ startingMemoryWordAddress: 1, disableSharedMemory: true }
		);
		const { instance, memory } = await instantiate(result.codeBuffer, result.requiredMemoryBytes);
		const view = new DataView(memory.buffer);
		const address = result.compiledModules.setup.memoryMap.value.byteAddress;

		(instance.exports.initDefaults as CallableFunction)();
		expect(view.getInt32(address, true)).toBe(0);

		(instance.exports.init as CallableFunction)();
		expect(view.getInt32(address, true)).toBe(7);
	});
});
