import { describe, expect, test } from 'vitest';
import { WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-wasm-utils';

import { createTestModule, createTestModuleWithFunctions } from './testUtils';

const unsafeAddresses = [-1, WASM_MEMORY_PAGE_SIZE - 3, 2147483647];

describe('guarded memory access integration', () => {
	test.each(unsafeAddresses)('explicit load returns zero for unsafe address %i', async address => {
		const testModule = await createTestModule(`module guardedLoad
int address
int output 123

loop
  push &output
  push address
  load
  store
loopEnd

moduleEnd`);

		testModule.memory.set('address', address);

		expect(() => testModule.test()).not.toThrow();
		expect(testModule.memory.get('output')).toBe(0);
	});

	test.each(unsafeAddresses)('explicit loadFloat returns zero for unsafe address %i', async address => {
		const testModule = await createTestModule(`module guardedLoadFloat
int address
float output 123.5

loop
  push &output
  push address
  loadFloat
  store
loopEnd

moduleEnd`);

		testModule.memory.set('address', address);

		expect(() => testModule.test()).not.toThrow();
		expect(testModule.memory.get('output')).toBeCloseTo(0, 6);
	});

	test.each(unsafeAddresses)('local pointer dereference returns zero for unsafe address %i', async address => {
		const testModule = await createTestModuleWithFunctions(
			`module guardedLocalPointerDereference
int address
int output 123

loop
  push &output
  push address
  call readPointer
  store
loopEnd

moduleEnd`,
			[
				`function readPointer
#impure
param int* ptr

push *ptr
functionEnd int`,
			]
		);

		testModule.memory.set('address', address);

		expect(() => testModule.test()).not.toThrow();
		expect(testModule.memory.get('output')).toBe(0);
	});
});
