import { describe, test, expect } from 'vitest';

import compile from '../src/index';

describe('#initOnly directive', () => {
	test.skip('module with #initOnly runs once during init and not during cycle', async () => {
		const modules = [
			{
				code: `
module initOnlyModule
#initOnly
int counter 0
push counter
push counter
load
push 1
add
store
moduleEnd
`.split('\n'),
			},
			{
				code: `
module normalModule
int counter 0
push counter
push counter
load
push 1
add
store
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1, disableSharedMemory: true });

		// Verify both modules are compiled
		expect(result.compiledModules.initOnlyModule).toBeDefined();
		expect(result.compiledModules.normalModule).toBeDefined();

		// Verify initOnlyExecution flag is set
		expect(result.compiledModules.initOnlyModule.initOnlyExecution).toBe(true);
		expect(result.compiledModules.normalModule.initOnlyExecution).toBeFalsy();

		// Instantiate WASM and test runtime behavior
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const buffer = new Int32Array(memory.buffer);

		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			js: { memory },
		});

		const initOnlyModuleAddr = result.compiledModules.initOnlyModule.memoryMap.counter.byteAddress / 4;
		const normalModuleAddr = result.compiledModules.normalModule.memoryMap.counter.byteAddress / 4;

		// Initially both counters should be 0
		expect(buffer[initOnlyModuleAddr]).toBe(0);
		expect(buffer[normalModuleAddr]).toBe(0);

		// After init, initOnlyModule counter should be 1, normalModule still 0
		(instance.exports as { init: () => void; cycle: () => void }).init();
		expect(buffer[initOnlyModuleAddr]).toBe(1);
		expect(buffer[normalModuleAddr]).toBe(0);

		// After first cycle, initOnlyModule counter stays 1, normalModule becomes 1
		(instance.exports as { init: () => void; cycle: () => void }).cycle();
		expect(buffer[initOnlyModuleAddr]).toBe(1);
		expect(buffer[normalModuleAddr]).toBe(1);

		// After second cycle, initOnlyModule counter stays 1, normalModule becomes 2
		(instance.exports as { init: () => void; cycle: () => void }).cycle();
		expect(buffer[initOnlyModuleAddr]).toBe(1);
		expect(buffer[normalModuleAddr]).toBe(2);

		// After third cycle, initOnlyModule counter stays 1, normalModule becomes 3
		(instance.exports as { init: () => void; cycle: () => void }).cycle();
		expect(buffer[initOnlyModuleAddr]).toBe(1);
		expect(buffer[normalModuleAddr]).toBe(3);
	});

	test('multiple #initOnly directives in same module are idempotent', () => {
		const modules = [
			{
				code: `
module testModule
#initOnly
int counter 0
#initOnly
push counter
push counter
load
push 1
add
store
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1 });

		expect(result.compiledModules.testModule).toBeDefined();
		expect(result.compiledModules.testModule.initOnlyExecution).toBe(true);
	});

	test('#initOnly in constants block throws error', () => {
		const modules = [
			{
				code: `
constants env
#initOnly
const SAMPLE_RATE 48000
constantsEnd
`.split('\n'),
			},
		];

		expect(() => {
			compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1 });
		}).toThrow();
	});

	test('#initOnly in function block throws error', () => {
		const modules = [
			{
				code: `
module testModule
int counter 0
moduleEnd
`.split('\n'),
			},
		];

		const functions = [
			{
				code: `
function int:int testFunc
#initOnly
param int input
push input
functionEnd
`.split('\n'),
			},
		];

		expect(() => {
			compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1 }, functions);
		}).toThrow();
	});

	test('memory initialization still occurs for initOnly modules', () => {
		const modules = [
			{
				code: `
module normalModule
int normalCounter 5
moduleEnd
`.split('\n'),
			},
			{
				code: `
module initOnlyModule
#initOnly
int initOnlyCounter 10
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1 });

		// Both modules should have memory initialized with defaults
		expect(result.compiledModules.normalModule.memoryMap.normalCounter.default).toBe(5);
		expect(result.compiledModules.initOnlyModule.memoryMap.initOnlyCounter.default).toBe(10);
	});

	test.skip('#skipExecution takes precedence over #initOnly when both are present', async () => {
		const modules = [
			{
				code: `
module bothDirectivesModule
#skipExecution
#initOnly
int counter 0
push counter
push counter
load
push 1
add
store
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1, disableSharedMemory: true });

		// Both flags should be set in metadata
		expect(result.compiledModules.bothDirectivesModule.skipExecutionInCycle).toBe(true);
		expect(result.compiledModules.bothDirectivesModule.initOnlyExecution).toBe(true);

		// Instantiate WASM and test runtime behavior - skipExecution should win
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const buffer = new Int32Array(memory.buffer);

		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			js: { memory },
		});

		const moduleAddr = result.compiledModules.bothDirectivesModule.memoryMap.counter.byteAddress / 4;

		// Initially counter should be 0
		expect(buffer[moduleAddr]).toBe(0);

		// After init, counter should still be 0 (skipExecution takes precedence)
		(instance.exports as { init: () => void; cycle: () => void }).init();
		expect(buffer[moduleAddr]).toBe(0);

		// After cycle, counter should still be 0
		(instance.exports as { init: () => void; cycle: () => void }).cycle();
		expect(buffer[moduleAddr]).toBe(0);

		// After another cycle, counter should still be 0
		(instance.exports as { init: () => void; cycle: () => void }).cycle();
		expect(buffer[moduleAddr]).toBe(0);
	});

	test.skip('#initOnly modules execute after all memory initialization', async () => {
		const modules = [
			{
				code: `
constants env
constantsEnd
`.split('\n'),
			},
			{
				code: `
module dataModule
int sharedValue 42
moduleEnd
`.split('\n'),
			},
			{
				code: `
module initOnlyModule
#initOnly
use dataModule
int result 0
push result
push dataModule:sharedValue
load
store
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1, disableSharedMemory: true });

		// Instantiate WASM and test runtime behavior
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const buffer = new Int32Array(memory.buffer);

		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			js: { memory },
		});

		const sharedValueAddr = result.compiledModules.dataModule.memoryMap.sharedValue.byteAddress / 4;
		const resultAddr = result.compiledModules.initOnlyModule.memoryMap.result.byteAddress / 4;

		// Initially sharedValue should be 42, result should be 0
		expect(buffer[sharedValueAddr]).toBe(42);
		expect(buffer[resultAddr]).toBe(0);

		// After init, result should be 42 (copied from sharedValue)
		(instance.exports as { init: () => void; cycle: () => void }).init();
		expect(buffer[sharedValueAddr]).toBe(42);
		expect(buffer[resultAddr]).toBe(42);

		// After cycle, both should remain unchanged
		(instance.exports as { init: () => void; cycle: () => void }).cycle();
		expect(buffer[sharedValueAddr]).toBe(42);
		expect(buffer[resultAddr]).toBe(42);
	});

	test.skip('multiple modules with #initOnly all execute during init', async () => {
		const modules = [
			{
				code: `
module initOnly1
#initOnly
int counter 10
push counter
push counter
load
push 1
add
store
moduleEnd
`.split('\n'),
			},
			{
				code: `
module initOnly2
#initOnly
int counter 20
push counter
push counter
load
push 2
add
store
moduleEnd
`.split('\n'),
			},
			{
				code: `
module initOnly3
#initOnly
int counter 30
push counter
push counter
load
push 3
add
store
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024, startingMemoryWordAddress: 1, disableSharedMemory: true });

		// Instantiate WASM and test runtime behavior
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const buffer = new Int32Array(memory.buffer);

		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			js: { memory },
		});

		const addr1 = result.compiledModules.initOnly1.memoryMap.counter.byteAddress / 4;
		const addr2 = result.compiledModules.initOnly2.memoryMap.counter.byteAddress / 4;
		const addr3 = result.compiledModules.initOnly3.memoryMap.counter.byteAddress / 4;

		// Initially all counters should be 0 (before init)
		expect(buffer[addr1]).toBe(0);
		expect(buffer[addr2]).toBe(0);
		expect(buffer[addr3]).toBe(0);

		// After init, counters should have defaults + increments (10+1, 20+2, 30+3)
		(instance.exports as { init: () => void; cycle: () => void }).init();
		expect(buffer[addr1]).toBe(11);
		expect(buffer[addr2]).toBe(22);
		expect(buffer[addr3]).toBe(33);

		// After cycle, all should remain unchanged
		(instance.exports as { init: () => void; cycle: () => void }).cycle();
		expect(buffer[addr1]).toBe(11);
		expect(buffer[addr2]).toBe(22);
		expect(buffer[addr3]).toBe(33);
	});
});
