import { describe, expect, test } from 'vitest';
import { ErrorCode } from '@8f4e/compiler-spec';

import compile from '../src/index';

import type { Module } from '@8f4e/compiler-spec';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	environmentExtensions: {
		constants: {},
	},
	disableSharedMemory: true,
	includeAST: true,
};

async function instantiate(functions: Module[]) {
	const result = compile(
		{ groups: { main: [{ code: ['module test', 'moduleEnd'] }] }, functions: functions },
		defaultOptions
	);
	const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
		js: { memory: new WebAssembly.Memory({ initial: 1, maximum: 1 }) },
	});
	return { result, exports: instance.exports };
}

describe('exported 8f4e functions', () => {
	test('exports a function under the requested name', async () => {
		const { result, exports } = await instantiate([
			{
				code: [
					'function add',
					'#export addFromJs',
					'param int a',
					'param int b',
					'push a',
					'push b',
					'add',
					'functionEnd int',
				],
			},
		]);

		expect(result.compiledFunctions.add.exportName).toBe('addFromJs');
		expect(exports.addFromJs).toBeTypeOf('function');
		expect((exports.addFromJs as CallableFunction)(2, 3)).toBe(5);
	});

	test('exports a function under its own name when no export name is provided', async () => {
		const { result, exports } = await instantiate([
			{
				code: [
					'function addFromJs',
					'#export',
					'param int a',
					'param int b',
					'push a',
					'push b',
					'add',
					'functionEnd int',
				],
			},
		]);

		expect(result.compiledFunctions.addFromJs.exportName).toBe('addFromJs');
		expect(exports.addFromJs).toBeTypeOf('function');
		expect((exports.addFromJs as CallableFunction)(2, 3)).toBe(5);
	});

	test('passes float and float64 arguments as positional JS numbers', async () => {
		const { exports } = await instantiate([
			{
				code: [
					'function addFloat',
					'#export addFloat',
					'param float a',
					'param float b',
					'push a',
					'push b',
					'add',
					'functionEnd float',
				],
			},
			{
				code: [
					'function addFloat64',
					'#export addFloat64',
					'param float64 a',
					'param float64 b',
					'push a',
					'push b',
					'add',
					'functionEnd float64',
				],
			},
		]);

		expect((exports.addFloat as CallableFunction)(0.25, 0.5)).toBeCloseTo(0.75);
		expect((exports.addFloat64 as CallableFunction)(0.1, 0.2)).toBeCloseTo(0.3);
	});

	test('rejects duplicate export directives in one function', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [{ code: ['function bad', '#export first', '#export second', 'functionEnd'] }],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.DUPLICATE_EXPORT_NAME }));
	});

	test('rejects duplicate export names across functions', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [
						{ code: ['function a', '#export same', 'functionEnd'] },
						{ code: ['function b', '#export same', 'functionEnd'] },
					],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.DUPLICATE_EXPORT_NAME }));
	});

	test('rejects built-in export names', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [{ code: ['function bad', '#export initDefaults', 'functionEnd'] }],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.DUPLICATE_EXPORT_NAME }));
	});

	test('rejects #export outside a function block', () => {
		expect(() =>
			compile({ groups: { main: [{ code: ['module test', '#export outside', 'moduleEnd'] }] } }, defaultOptions)
		).toThrow(expect.objectContaining({ code: ErrorCode.EXPORT_DIRECTIVE_INVALID_CONTEXT }));
	});
});
