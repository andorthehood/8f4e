import { describe, expect, test } from 'vitest';
import { ErrorCode } from '@8f4e/compiler-spec';

import compile from '../src/index';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	environmentExtensions: {
		constants: {},
	},
	disableSharedMemory: true,
	includeAST: true,
};

describe('function imports', () => {
	test('calls a void imported function from a module', async () => {
		const calls: number[] = [];
		const result = compile(
			{
				groups: {
					main: [{ code: ['module test', 'push 41', 'call hostRecord', 'moduleEnd'] }],
				},
				functions: [{ code: ['function hostRecord', '#import record', 'param int value', 'functionEnd'] }],
			},
			defaultOptions
		);

		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			host: {
				memory: new WebAssembly.Memory({ initial: 1, maximum: 1 }),
				record: (value: number) => calls.push(value),
			},
		});

		(instance.exports.main as CallableFunction)();

		expect(calls).toEqual([41]);
		expect(result.compiledFunctions!.hostRecord.import).toEqual({ moduleName: 'host', fieldName: 'record' });
	});

	test('calls an imported function with a return value and string field name', async () => {
		const result = compile(
			{
				groups: {
					main: [
						{
							code: ['module test', 'int output', 'push &output', 'push 41', 'call addOne', 'store', 'moduleEnd'],
						},
					],
				},
				functions: [
					{
						code: ['function addOne', '#import "add.one"', 'param int value', 'functionEnd int'],
					},
				],
			},
			defaultOptions
		);
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			host: { memory, 'add.one': (value: number) => value + 1 },
		});

		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

		const output = result.compiledModules.test.memoryMap.output.byteAddress;
		expect(new DataView(memory.buffer).getInt32(output, true)).toBe(42);
	});

	test('assigns imported function indexes before built-ins and defined functions', () => {
		const result = compile(
			{
				groups: { main: [{ code: ['module test', 'call localValue', 'drop', 'moduleEnd'] }] },
				functions: [
					{ code: ['function hostValue', '#import value', 'functionEnd int'] },
					{ code: ['function localValue', 'call hostValue', 'functionEnd int'] },
				],
			},
			defaultOptions
		);

		expect(result.compiledFunctions!.hostValue.wasmIndex).toBe(0);
		expect(result.compiledFunctions!.localValue.wasmIndex).toBe(4);
		expect(result.compiledFunctions!.hostValue.body).toEqual([]);
		expect(result.compiledFunctions!.localValue.body.length).toBeGreaterThan(0);
	});

	test('keeps the assertion failure import before user imports', () => {
		const result = compile(
			{
				groups: {
					main: [{ code: ['module test', 'push 1', 'assert 1', 'push 2', 'call hostRecord', 'moduleEnd'] }],
				},
				functions: [{ code: ['function hostRecord', '#import record', 'param int value', 'functionEnd'] }],
			},
			defaultOptions
		);

		expect(result.compiledFunctions!.hostRecord.wasmIndex).toBe(1);
	});

	test('rejects executable imported function bodies', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [{ code: ['function bad', '#import bad', 'push 1', 'functionEnd int'] }],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.IMPORTED_FUNCTION_BODY }));
	});

	test('rejects imported functions that also export', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [{ code: ['function bad', '#import bad', '#export bad', 'functionEnd'] }],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.IMPORT_EXPORT_CONFLICT }));
	});

	test('rejects duplicate import directives', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [{ code: ['function bad', '#import one', '#import two', 'functionEnd'] }],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.DUPLICATE_FUNCTION_IMPORT }));
	});

	test('rejects #import outside a function block', () => {
		expect(() =>
			compile({ groups: { main: [{ code: ['module test', '#import record', 'moduleEnd'] }] } }, defaultOptions)
		).toThrow(expect.objectContaining({ code: ErrorCode.IMPORT_DIRECTIVE_INVALID_CONTEXT }));
	});
});
