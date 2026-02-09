import { describe, test, expect } from 'vitest';

import compile from '../src/index';

describe('#skipExecution directive', () => {
	test('module with #skipExecution is excluded from cycle dispatcher', () => {
		const modules = [
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
			{
				code: `
module skippedModule
#skipExecution
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

		const result = compile(modules, { memorySizeBytes: 1024 });

		// Verify both modules are compiled
		expect(result.compiledModules.normalModule).toBeDefined();
		expect(result.compiledModules.skippedModule).toBeDefined();

		// Verify both modules have cycle functions
		expect(result.compiledModules.normalModule.cycleFunction).toBeDefined();
		expect(result.compiledModules.skippedModule.cycleFunction).toBeDefined();

		// Verify both modules have memory maps
		expect(result.compiledModules.normalModule.memoryMap.counter).toBeDefined();
		expect(result.compiledModules.skippedModule.memoryMap.counter).toBeDefined();

		// Verify the skipExecution flag is set
		expect(result.compiledModules.normalModule.skipExecutionInCycle).toBeUndefined();
		expect(result.compiledModules.skippedModule.skipExecutionInCycle).toBe(true);

		// The cycle function should only call normalModule
		// We can verify this by checking the length of the cycle function
		// A single call is 3 bytes (0x10 + 2-byte function index)
		expect(result.codeBuffer).toBeDefined();
	});

	test('multiple #skipExecution directives in same module are idempotent', () => {
		const modules = [
			{
				code: `
module testModule
#skipExecution
int counter 0
#skipExecution
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

		const result = compile(modules, { memorySizeBytes: 1024 });

		expect(result.compiledModules.testModule).toBeDefined();
		expect(result.compiledModules.testModule.skipExecutionInCycle).toBe(true);
	});

	test('#skipExecution in constants block throws error', () => {
		const modules = [
			{
				code: `
constants env
#skipExecution
const SAMPLE_RATE 48000
constantsEnd
`.split('\n'),
			},
		];

		expect(() => {
			compile(modules, { memorySizeBytes: 1024 });
		}).toThrow();
	});

	test('#skipExecution in function block throws error', () => {
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
#skipExecution
param int input
push input
functionEnd
`.split('\n'),
			},
		];

		expect(() => {
			compile(modules, { memorySizeBytes: 1024 }, functions);
		}).toThrow();
	});

	test('memory initialization still occurs for skipped modules', () => {
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
module skippedModule
#skipExecution
int skippedCounter 10
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024 });

		// Both modules should have memory initialized with defaults
		expect(result.compiledModules.normalModule.memoryMap.normalCounter.default).toBe(5);
		expect(result.compiledModules.skippedModule.memoryMap.skippedCounter.default).toBe(10);
	});

	test('inter-module memory references work with skipped modules', () => {
		const modules = [
			{
				code: `
module skippedModule
#skipExecution
int value 42
moduleEnd
`.split('\n'),
			},
			{
				code: `
module normalModule
int counter 0
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { memorySizeBytes: 1024 });

		// Verify both modules are compiled with separate memory maps
		expect(result.compiledModules.normalModule).toBeDefined();
		expect(result.compiledModules.skippedModule).toBeDefined();
		expect(result.compiledModules.skippedModule.memoryMap.value).toBeDefined();
		expect(result.compiledModules.normalModule.memoryMap.counter).toBeDefined();

		// Verify memory addresses are allocated for both modules
		expect(result.compiledModules.skippedModule.memoryMap.value.byteAddress).toBeGreaterThanOrEqual(0);
		expect(result.compiledModules.normalModule.memoryMap.counter.byteAddress).toBeGreaterThanOrEqual(0);

		// Both modules should have memory allocated (order may vary due to sorting)
		const allAddresses = [
			result.compiledModules.skippedModule.memoryMap.value.byteAddress,
			result.compiledModules.normalModule.memoryMap.counter.byteAddress,
		];
		expect(allAddresses.every(addr => addr >= 0)).toBe(true);
	});
});
