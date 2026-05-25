import { describe, expect, test } from 'vitest';
import { ErrorCode, WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-spec';

import { createTestModule } from './testUtils';

const moduleSource = `module pointerMutationGuard
int target 11
int replacement 22
int* ptr &target
int candidate

loop
  push &ptr
  push candidate
  store
loopEnd

moduleEnd`;

describe('pointer mutation guards', () => {
	test('rejects known out-of-bounds pointer values at compile time', async () => {
		await expect(
			createTestModule(`module invalidPointerMutation
int* ptr

loop
  push &ptr
  push -1
  store
loopEnd

moduleEnd`)
		).rejects.toMatchObject({ code: ErrorCode.INVALID_POINTER_ADDRESS });
	});

	test('stores an unproven pointer value when it is in bounds at runtime', async () => {
		const testModule = await createTestModule(moduleSource);
		const replacementAddress = testModule.memoryMap.replacement.byteAddress;

		testModule.memory.set('candidate', replacementAddress);

		expect(() => testModule.test()).not.toThrow();
		expect(testModule.memory.get('ptr')).toBe(replacementAddress);
	});

	test.each([-1, WASM_MEMORY_PAGE_SIZE - 3, 2147483647])(
		'skips an unproven pointer value when %i is out of bounds at runtime',
		async candidate => {
			const testModule = await createTestModule(moduleSource);
			const originalAddress = testModule.memoryMap.target.byteAddress;

			testModule.memory.set('candidate', candidate);

			expect(() => testModule.test()).not.toThrow();
			expect(testModule.memory.get('ptr')).toBe(originalAddress);
		}
	);
});
