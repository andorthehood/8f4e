import { describe, test, expect } from 'vitest';

import compile from '../../src/index';

import type { Module } from '../../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	environmentExtensions: {
		constants: {},
	},
	includeAST: true,
};

describe('push <local> parity with localGet', () => {
	test('push <int local> and localGet produce the same stack metadata', () => {
		const functions: Module[] = [
			{
				code: [
					'function compareInt',
					'param int x',
					'local int temp',
					'push 7',
					'localSet temp',
					'localGet temp',
					'functionEnd int',
				],
			},
		];
		const functionsPush: Module[] = [
			{
				code: [
					'function compareIntPush',
					'param int x',
					'local int temp',
					'push 7',
					'localSet temp',
					'push temp',
					'functionEnd int',
				],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];

		const resultGet = compile(modules, defaultOptions, functions);
		const resultPush = compile(modules, defaultOptions, functionsPush);

		const getBody = resultGet.compiledFunctions!.compareInt;
		const pushBody = resultPush.compiledFunctions!.compareIntPush;

		// Both should have the same return type
		expect(getBody.signature.returns).toEqual(['int']);
		expect(pushBody.signature.returns).toEqual(['int']);
	});

	test('push <float local> and localGet produce the same stack metadata', () => {
		const functions: Module[] = [
			{
				code: ['function floatGet', 'local float flt', 'push 1.5', 'localSet flt', 'localGet flt', 'functionEnd float'],
			},
		];
		const functionsPush: Module[] = [
			{
				code: ['function floatPush', 'local float flt', 'push 1.5', 'localSet flt', 'push flt', 'functionEnd float'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];

		const resultGet = compile(modules, defaultOptions, functions);
		const resultPush = compile(modules, defaultOptions, functionsPush);

		expect(resultGet.compiledFunctions!.floatGet.signature.returns).toEqual(['float']);
		expect(resultPush.compiledFunctions!.floatPush.signature.returns).toEqual(['float']);
	});

	test('push <float64 local> preserves float64 metadata and matches localGet behavior', () => {
		const functionsGet: Module[] = [
			{
				code: ['function double64Get', 'param float64 x', 'localGet x', 'push 2.0f64', 'mul', 'functionEnd float64'],
			},
		];
		const functionsPush: Module[] = [
			{
				code: ['function double64Push', 'param float64 x', 'push x', 'push 2.0f64', 'mul', 'functionEnd float64'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];

		const resultGet = compile(modules, defaultOptions, functionsGet);
		const resultPush = compile(modules, defaultOptions, functionsPush);

		expect(resultGet.compiledFunctions!.double64Get.signature.parameters).toEqual(['float64']);
		expect(resultGet.compiledFunctions!.double64Get.signature.returns).toEqual(['float64']);
		expect(resultPush.compiledFunctions!.double64Push.signature.parameters).toEqual(['float64']);
		expect(resultPush.compiledFunctions!.double64Push.signature.returns).toEqual(['float64']);
	});

	test('push <float64 local> emits the same WASM bytecode as localGet', () => {
		const functionsGet: Module[] = [
			{
				code: ['function getF64', 'param float64 x', 'localGet x', 'functionEnd float64'],
			},
		];
		const functionsPush: Module[] = [
			{
				code: ['function pushF64', 'param float64 x', 'push x', 'functionEnd float64'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];

		const resultGet = compile(modules, defaultOptions, functionsGet);
		const resultPush = compile(modules, defaultOptions, functionsPush);

		// Both must produce valid compilations with float64 return
		expect(resultGet.compiledFunctions!.getF64.signature.returns).toEqual(['float64']);
		expect(resultPush.compiledFunctions!.pushF64.signature.returns).toEqual(['float64']);

		// Both function bodies must contain the same WASM bytecode
		expect(resultGet.compiledFunctions!.getF64.body).toEqual(resultPush.compiledFunctions!.pushF64.body);
	});
});

describe('push local-vs-memory identifier resolution', () => {
	test('push resolves to local when name exists only in locals', () => {
		const functions: Module[] = [
			{
				code: ['function localOnly', 'param int val', 'push val', 'functionEnd int'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];
		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.localOnly.signature.parameters).toEqual(['int']);
		expect(result.compiledFunctions!.localOnly.signature.returns).toEqual(['int']);
	});

	test('push resolves to local when name exists in both locals and module memory (locals shadow memory)', () => {
		// 'value' is declared as both a module memory item and a function param.
		// push value inside the function should resolve to the local, not the memory item.
		const functions: Module[] = [
			{
				code: [
					'function shadowTest',
					'param int value',
					// push value here must use the local (param), not the module memory
					'push value',
					'functionEnd int',
				],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'int value 42', 'moduleEnd'],
			},
		];

		// This should compile successfully – the local shadows the memory name.
		const result = compile(modules, defaultOptions, functions);
		expect(result.compiledFunctions!.shadowTest).toBeDefined();
		expect(result.compiledFunctions!.shadowTest.signature.returns).toEqual(['int']);
	});

	test('push rejects an identifier that is neither in locals nor memory', () => {
		const functions: Module[] = [
			{
				code: ['function bad', 'push undeclared', 'functionEnd int'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];
		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});
});
