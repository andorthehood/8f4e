import { describe, test, expect } from 'vitest';

import { createTestModuleWithFunctions } from './testUtils';

describe('Strength Reduction Optimization Integration Tests', () => {
	test('x * 2 is optimized to shift left by 1', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function double
				param int x
				localGet x
				push 2
				mul
				functionEnd int`,
			]
		);

		// Verify the optimization was applied
		expect(testModule.wat).toContain('i32.shl');
		expect(testModule.wat).not.toContain('i32.mul');
		expect(testModule.wat).toMatch(/i32\.const 1/); // shift amount
	});

	test('x * 4 is optimized to shift left by 2', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function quadruple
				param int x
				localGet x
				push 4
				mul
				functionEnd int`,
			]
		);

		expect(testModule.wat).toContain('i32.shl');
		expect(testModule.wat).not.toContain('i32.mul');
		expect(testModule.wat).toMatch(/i32\.const 2/); // shift amount
	});

	test('x / 2 is optimized to shift right by 1', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function halve
				param int x
				localGet x
				push 2
				div
				functionEnd int`,
			]
		);

		expect(testModule.wat).toContain('i32.shr_s');
		expect(testModule.wat).not.toContain('i32.div_s');
		expect(testModule.wat).toMatch(/i32\.const 1/); // shift amount
	});

	test('x * 1 is optimized to identity (no operation)', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function identity
				param int x
				localGet x
				push 1
				mul
				functionEnd int`,
			]
		);

		// Should not contain multiplication, should have drop optimization
		expect(testModule.wat).not.toContain('i32.mul');
		expect(testModule.wat).toMatch(/local\.get 0[\s\S]*i32\.const 1[\s\S]*drop/);
	});

	test('x * 0 is optimized to constant 0', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function zero
				param int x
				localGet x
				push 0
				mul
				functionEnd int`,
			]
		);

		// Should not contain multiplication
		expect(testModule.wat).not.toContain('i32.mul');
		// Should have the drop-drop-const0 pattern
		expect(testModule.wat).toMatch(/drop[\s\S]*drop[\s\S]*i32\.const 0/);
	});

	test('x + 0 is optimized to identity', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function addZero
				param int x
				localGet x
				push 0
				add
				functionEnd int`,
			]
		);

		// Should not contain addition, should have drop
		expect(testModule.wat).not.toContain('i32.add');
		expect(testModule.wat).toMatch(/local\.get 0[\s\S]*i32\.const 0[\s\S]*drop/);
	});

	test('x - 0 is optimized to identity', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function subZero
				param int x
				localGet x
				push 0
				sub
				functionEnd int`,
			]
		);

		// The optimization should use DROP - check for this specific pattern
		// The function should have "local.get 0" (param), then "i32.const 0", then "drop"
		expect(testModule.wat).toMatch(/local\.get 0[\s\S]*i32\.const 0[\s\S]*drop/);
	});

	test('non-power-of-2 multiplication is not optimized', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function triple
				param int x
				localGet x
				push 3
				mul
				functionEnd int`,
			]
		);

		// Should still use multiplication
		expect(testModule.wat).toContain('i32.mul');
		expect(testModule.wat).not.toContain('i32.shl');
	});

	test('float multiplication is not optimized', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
			moduleEnd`,
			[
				`function doubleFloat
				param float x
				localGet x
				push 2.0
				mul
				functionEnd float`,
			]
		);

		// Should use float multiplication
		expect(testModule.wat).toContain('f32.mul');
		expect(testModule.wat).not.toContain('i32.shl');
	});
});
