import { describe, expect, test } from 'vitest';
import { ErrorCode } from '@8f4e/compiler-spec';

import compile from '../src';

async function instantiate(codeBuffer: Uint8Array, requiredMemoryBytes: number) {
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / 65536));
	const memory = new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages, shared: false });
	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		host: { memory },
	});
	return { instance, memory };
}

describe('execution entries', () => {
	test('exports each group as an independently callable dispatcher', async () => {
		const result = compile(
			{
				entries: {
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

	test('initDefaults does not execute user-authored init entries', async () => {
		const result = compile(
			{
				entries: {
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

	test('does not export buffer by default', async () => {
		const result = compile(
			{
				entries: {
					main: [
						{
							code: ['module test', 'moduleEnd'],
						},
					],
				},
			},
			{ startingMemoryWordAddress: 1, disableSharedMemory: true }
		);
		const { instance } = await instantiate(result.codeBuffer, result.requiredMemoryBytes);

		expect(instance.exports.buffer).toBeUndefined();
	});

	test('allows functions to call entries', async () => {
		const result = compile(
			{
				entries: {
					main: [
						{
							code: [
								'module counter',
								'int value 0',
								'push &value',
								'push value',
								'push 1',
								'add',
								'store',
								'moduleEnd',
							],
						},
					],
				},
				constants: [
					{
						code: ['constants env', 'const LIMIT 4', 'constantsEnd'],
					},
				],
				functions: [
					{
						code: [
							'function buffer',
							'#export buffer',
							'local int i',
							'use env',
							'loop',
							'push i',
							'push LIMIT',
							'greaterOrEqual',
							'branchIfTrue 1',
							'call main',
							'push i',
							'push 1',
							'add',
							'localSet i',
							'loopEnd',
							'functionEnd',
						],
					},
				],
			},
			{ startingMemoryWordAddress: 1, disableSharedMemory: true }
		);
		const { instance, memory } = await instantiate(result.codeBuffer, result.requiredMemoryBytes);
		const view = new DataView(memory.buffer);
		const address = result.compiledModules.counter.memoryMap.value.byteAddress;

		expect(instance.exports.buffer).toEqual(expect.any(Function));

		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.buffer as CallableFunction)();

		expect(view.getInt32(address, true)).toBe(4);
	});

	test('rejects function names that collide with entry names', () => {
		expect(() =>
			compile(
				{
					entries: {
						main: [
							{
								code: ['module test', 'moduleEnd'],
							},
						],
					},
					functions: [
						{
							code: ['function main', 'functionEnd'],
						},
					],
				},
				{ startingMemoryWordAddress: 1, disableSharedMemory: true }
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.DUPLICATE_IDENTIFIER }));
	});
});
