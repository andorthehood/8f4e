import { describe, expect, test } from 'vitest';
import { WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-wasm-utils';

import compile from '../src/index';

import type { Module } from '@8f4e/compiler-spec';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	disableSharedMemory: true,
	includeAST: true,
};

const assertFunction: Module = {
	code: ['function assert', '#import assert', 'param int received', 'param int expected', 'functionEnd'],
};

async function instantiate(groups: Record<string, Module[]>, functions: Module[] = []) {
	const result = compile({ groups, functions: [...functions, assertFunction] }, defaultOptions);
	const assertCalls: Array<{ received: number; expected: number }> = [];
	const memorySizePages = Math.max(1, Math.ceil(result.requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
	const memory = new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
	const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
		host: {
			memory,
			assert(received: number, expected: number) {
				assertCalls.push({ received, expected });
			},
		},
	});

	return {
		result,
		assertCalls,
		exports: instance.exports as WebAssembly.Exports & {
			initDefaults: CallableFunction;
			main: CallableFunction;
			test: CallableFunction;
		},
	};
}

describe('execution groups and imported assert utility', () => {
	test('executes test group modules from the test export', async () => {
		const { exports, assertCalls, result } = await instantiate({
			main: [
				{
					code: ['module production', 'moduleEnd'],
				},
			],
			test: [
				{
					code: ['module addWorks', 'push 1', 'push 2', 'add', 'push 4', 'call assert', 'moduleEnd'],
				},
			],
		});

		exports.initDefaults();
		exports.main();

		expect(assertCalls).toEqual([]);

		exports.test();

		expect(assertCalls).toEqual([{ received: 3, expected: 4 }]);
		expect(result.compiledModules.addWorks.executionGroupName).toBe('test');
	});

	test('supports memory declarations and pointer arguments in test modules', async () => {
		const { exports, assertCalls } = await instantiate(
			{
				test: [
					{
						code: [
							'module readFirstWorks',
							'int[] values 2 7 8',
							'push &values',
							'call readFirst',
							'push 7',
							'call assert',
							'moduleEnd',
						],
					},
				],
			},
			[
				{
					code: ['function readFirst', '#impure', 'param int* ptr', 'push *ptr', 'functionEnd int'],
				},
			]
		);

		exports.initDefaults();
		exports.test();

		expect(assertCalls).toEqual([{ received: 7, expected: 7 }]);
	});
});
