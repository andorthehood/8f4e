import { describe, expect, test } from 'vitest';
import { WASM_MEMORY_PAGE_SIZE } from '@8f4e/compiler-wasm-utils';
import { ErrorCode } from '@8f4e/compiler-spec';
import { compileToAST } from '@8f4e/tokenizer';

import compile from '../src/index';
import { compileModules } from '../src';

import type { Module } from '@8f4e/compiler-spec';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	disableSharedMemory: true,
	includeAST: true,
};

async function instantiate(groups: Record<string, Module[]>, functions?: Module[]) {
	const result = compile({ groups, functions: functions }, defaultOptions);
	const failureCalls: Array<{ assertIndex: number; expected: number; received: number }> = [];
	const memorySizePages = Math.max(1, Math.ceil(result.requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
	const memory = new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
	const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
		host: { memory },
		test: {
			assertFailed(assertIndex: number, expected: number, received: number) {
				failureCalls.push({ assertIndex, expected, received });
			},
		},
	});

	return {
		result,
		failureCalls,
		exports: instance.exports as WebAssembly.Exports & {
			initDefaults: CallableFunction;
			main: CallableFunction;
			test: CallableFunction;
		},
	};
}

describe('execution groups and assert', () => {
	test('executes test group modules from the test export', async () => {
		const { exports, failureCalls, result } = await instantiate({
			main: [
				{
					code: ['module production', 'moduleEnd'],
				},
			],
			test: [
				{
					code: ['module addWorks', 'push 1', 'push 2', 'add', 'assert 4', 'moduleEnd'],
				},
			],
		});

		exports.initDefaults();
		exports.main();

		expect(failureCalls).toEqual([]);

		exports.test();

		expect(failureCalls).toEqual([{ assertIndex: 0, expected: 4, received: 3 }]);
		expect(result.assertions).toEqual([
			{
				assertIndex: 0,
				moduleId: 'addWorks',
				lineNumber: 5,
				expected: 4,
			},
		]);
		expect(result.compiledModules.addWorks.executionGroupName).toBe('test');
	});

	test('exports test groups like any other execution group', () => {
		const result = compile(
			{
				groups: {
					main: [
						{
							code: ['module production', 'moduleEnd'],
						},
					],
					test: [
						{
							code: ['module emptyTest', 'moduleEnd'],
						},
					],
				},
			},
			defaultOptions
		);

		expect(result.compiledModules.emptyTest.executionGroupName).toBe('test');
	});

	test('does not report passing assertions', async () => {
		const { exports, failureCalls } = await instantiate({
			test: [
				{
					code: ['module addWorks', 'push 1', 'push 2', 'add', 'assert 3', 'moduleEnd'],
				},
			],
		});

		exports.initDefaults();
		exports.test();

		expect(failureCalls).toEqual([]);
	});

	test('supports memory declarations and pointer arguments in test modules', async () => {
		const { exports, failureCalls } = await instantiate(
			{
				test: [
					{
						code: [
							'module readFirstWorks',
							'int[] values 2 7 8',
							'push &values',
							'call readFirst',
							'assert 7',
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

		expect(failureCalls).toEqual([]);
	});

	test('allows assert in any execution group', async () => {
		const { exports, failureCalls, result } = await instantiate({
			main: [
				{
					code: ['module production', 'push 1', 'assert 2', 'moduleEnd'],
				},
			],
		});

		exports.initDefaults();
		exports.main();

		expect(failureCalls).toEqual([{ assertIndex: 0, expected: 2, received: 1 }]);
		expect(result.assertions).toEqual([
			{
				assertIndex: 0,
				moduleId: 'production',
				lineNumber: 3,
				expected: 2,
			},
		]);
	});

	test('rejects non-integer expected values before codegen', () => {
		expect(() =>
			compile(
				{ groups: { test: [{ code: ['module badAssert', 'push 1', 'assert 1.5', 'moduleEnd'] }] } },
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.TYPE_MISMATCH }));
	});

	test('reports a dedicated error when assert is compiled without the failure handler context', () => {
		const ast = compileToAST(['module directAssert', 'push 1', 'assert 1', 'moduleEnd']);
		if (ast.type === 'function') {
			throw new Error('Expected module AST.');
		}

		expect(() => compileModules([ast], defaultOptions)).toThrow(
			expect.objectContaining({ code: ErrorCode.MISSING_ASSERT_FAILURE_HANDLER })
		);
	});
});
