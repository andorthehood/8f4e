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
	includeTestRunner: true,
};

async function instantiate(modules: Module[], functions?: Module[]) {
	const result = compile(modules, defaultOptions, functions);
	const failureCalls: Array<{ assertIndex: number; expected: number; received: number }> = [];
	const memorySizePages = Math.max(1, Math.ceil(result.requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
	const memory = new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
	const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
		js: { memory },
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
			init: CallableFunction;
			cycle: CallableFunction;
			runTests: CallableFunction;
		},
	};
}

describe('#test modules and assert runner', () => {
	test('excludes #test modules from cycle and executes them from runTests', async () => {
		const { exports, failureCalls, result } = await instantiate([
			{
				code: ['module production', 'moduleEnd'],
			},
			{
				code: ['module addWorks', '#test', 'push 1', 'push 2', 'add', 'assert 4', 'moduleEnd'],
			},
		]);

		exports.init();
		exports.cycle();

		expect(failureCalls).toEqual([]);

		exports.runTests();

		expect(failureCalls).toEqual([{ assertIndex: 0, expected: 4, received: 3 }]);
		expect(result.testAssertions).toEqual([
			{
				assertIndex: 0,
				moduleId: 'addWorks',
				lineNumber: 6,
				expected: 4,
			},
		]);
		expect(result.testModuleIds).toEqual(['addWorks']);
		expect(result.compiledModules.addWorks.testExecution).toBe(true);
	});

	test('reports #test modules from parsed AST metadata', () => {
		const result = compile(
			[
				{
					code: ['module production', 'moduleEnd'],
				},
				{
					code: ['module emptyTest', '#test ; inline comment', 'moduleEnd'],
				},
			],
			defaultOptions
		);

		expect(result.testModuleIds).toEqual(['emptyTest']);
		expect(result.compiledModules.emptyTest.testExecution).toBe(true);
	});

	test('does not report passing assertions', async () => {
		const { exports, failureCalls } = await instantiate([
			{
				code: ['module addWorks', '#test', 'push 1', 'push 2', 'add', 'assert 3', 'moduleEnd'],
			},
		]);

		exports.init();
		exports.runTests();

		expect(failureCalls).toEqual([]);
	});

	test('supports memory declarations and pointer arguments in #test modules', async () => {
		const { exports, failureCalls } = await instantiate(
			[
				{
					code: [
						'module readFirstWorks',
						'#test',
						'int[] values 2 7 8',
						'push &values',
						'call readFirst',
						'assert 7',
						'moduleEnd',
					],
				},
			],
			[
				{
					code: ['function readFirst', '#impure', 'param int* ptr', 'push *ptr', 'functionEnd int'],
				},
			]
		);

		exports.init();
		exports.runTests();

		expect(failureCalls).toEqual([]);
	});

	test('omits #test modules and test imports from normal builds', async () => {
		const result = compile(
			[
				{
					code: ['module production', 'moduleEnd'],
				},
				{
					code: ['module addWorks', '#test', 'push 1', 'assert 1', 'moduleEnd'],
				},
			],
			{
				startingMemoryWordAddress: 1,
				disableSharedMemory: true,
				includeAST: true,
			}
		);
		const memorySizePages = Math.max(1, Math.ceil(result.requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));
		const memory = new WebAssembly.Memory({ initial: memorySizePages, maximum: memorySizePages });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			js: { memory },
		});

		expect(result.compiledModules.addWorks).toBeUndefined();
		expect(result.testModuleIds).toEqual(['addWorks']);
		expect(result.testAssertions).toBeUndefined();
		expect(instance.exports.runTests).toBeUndefined();
	});

	test('rejects assert in normal modules when test support is not enabled', () => {
		expect(() =>
			compile(
				[
					{
						code: ['module production', 'push 1', 'assert 1', 'moduleEnd'],
					},
				],
				{
					startingMemoryWordAddress: 1,
					disableSharedMemory: true,
					includeAST: true,
				}
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.MISSING_ASSERT_FAILURE_HANDLER }));
	});

	test('rejects non-integer expected values before codegen', () => {
		expect(() =>
			compile([{ code: ['module badAssert', '#test', 'push 1', 'assert 1.5', 'moduleEnd'] }], defaultOptions)
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
