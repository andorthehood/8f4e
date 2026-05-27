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

describe('push <local>', () => {
	test('push <int local> compiles correctly', () => {
		const functions: Module[] = [
			{
				code: [
					'function readInt',
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

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.readInt.signature.parameters).toEqual(['int']);
		expect(result.compiledFunctions!.readInt.signature.returns).toEqual(['int']);
		expect(result.compiledFunctions!.readInt.body.length).toBeGreaterThan(0);
	});

	test('push <float local> compiles correctly', () => {
		const functions: Module[] = [
			{
				code: ['function floatRead', 'local float flt', 'push 1.5', 'localSet flt', 'push flt', 'functionEnd float'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.floatRead.signature.returns).toEqual(['float']);
		expect(result.compiledFunctions!.floatRead.body.length).toBeGreaterThan(0);
	});

	test('push <float64 local> preserves float64 metadata', () => {
		const functions: Module[] = [
			{
				code: ['function double64Read', 'param float64 x', 'push x', 'push 2.0f64', 'mul', 'functionEnd float64'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.double64Read.signature.parameters).toEqual(['float64']);
		expect(result.compiledFunctions!.double64Read.signature.returns).toEqual(['float64']);
	});

	test('push <float64 local> produces valid bytecode', () => {
		const functions: Module[] = [
			{
				code: ['function getF64', 'param float64 x', 'push x', 'functionEnd float64'],
			},
		];

		const modules: Module[] = [{ code: ['module test', 'moduleEnd'] }];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.getF64.signature.returns).toEqual(['float64']);
		expect(result.compiledFunctions!.getF64.body.length).toBeGreaterThan(0);
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

		const result = compile(modules, defaultOptions, functions);

		// local.get opcode (0x20 = 32) must be present; i32.load opcode (0x28 = 40) must not be
		const LOCAL_GET = 0x20;
		const I32_LOAD = 0x28;
		expect(result.compiledFunctions!.shadowTest.body).toContain(LOCAL_GET);
		expect(result.compiledFunctions!.shadowTest.body).not.toContain(I32_LOAD);

		// The emitted bytecode must be identical to a function that has no competing module-memory item
		const functionsNoMemory: Module[] = [
			{
				code: ['function localOnly', 'param int value', 'push value', 'functionEnd int'],
			},
		];
		const resultNoMemory = compile([{ code: ['module test', 'moduleEnd'] }], defaultOptions, functionsNoMemory);
		expect(result.compiledFunctions!.shadowTest.body).toEqual(resultNoMemory.compiledFunctions!.localOnly.body);
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

describe('push pointer dereference depth', () => {
	const createPointerModule = (declaration: string, initializer: string, dereference: string): Module[] => [
		{
			code: [
				'module test',
				'float value 1.5',
				'float* ptr &value',
				`${declaration} pptr ${initializer}`,
				'loop',
				`push ${dereference}`,
				'drop',
				'loopEnd',
				'moduleEnd',
			],
		},
	];

	test('rejects dereference depth greater than the declared pointer depth', () => {
		const modules: Module[] = [
			{
				code: [
					'module test',
					'float value 1.5',
					'float* ptr &value',
					'loop',
					'push **ptr',
					'drop',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow(/Pointer dereference depth exceeds/);
	});

	test('dereferences only as many levels as the push argument requests', () => {
		const oneLevel = compile(createPointerModule('float**', '&ptr', '*pptr'), defaultOptions);
		const twoLevels = compile(createPointerModule('float**', '&ptr', '**pptr'), defaultOptions);

		const F32_LOAD = 0x2a;
		expect(oneLevel.compiledModules.test.cycleFunction).not.toContain(F32_LOAD);
		expect(twoLevels.compiledModules.test.cycleFunction).toContain(F32_LOAD);
	});
});
