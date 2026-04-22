import { describe, test, expect } from 'vitest';

import { createTestModuleWithFunctions, moduleTesterWithFunctions } from './testUtils';

import compile from '../../src';

moduleTesterWithFunctions(
	'call constant function',
	`module test
int output

loop
  push &output
  call getFortyTwo
  store
loopEnd

moduleEnd`,
	[
		`function getFortyTwo
push 42
functionEnd int`,
	],
	[[{}, { output: 42 }]]
);

moduleTesterWithFunctions(
	'call function with parameter',
	`module test
int input
int output

loop
  push &output
  push input
  call double
  store
loopEnd

moduleEnd`,
	[
		`function double
param int x
push x
push 2
mul
functionEnd int`,
	],
	[
		[{ input: 5 }, { output: 10 }],
		[{ input: 10 }, { output: 20 }],
	]
);

moduleTesterWithFunctions(
	'call function multiple times',
	`module test
int output

loop
  push &output
  call getTwo
  call getThree
  add
  store
loopEnd

moduleEnd`,
	[
		`function getTwo
push 2
functionEnd int`,
		`function getThree
push 3
functionEnd int`,
	],
	[[{}, { output: 5 }]]
);

moduleTesterWithFunctions(
	'function can call another function with its signature and wasm index available during compilation',
	`module test
int output

loop
  push &output
  call compute
  store
loopEnd

moduleEnd`,
	[
		`function increment
param int x
push x
push 1
add
functionEnd int`,
		`function compute
push 41
call increment
functionEnd int`,
	],
	[[{}, { output: 42 }]]
);

describe('call instruction (float64)', () => {
	test('passes float64 param and return through call without downgrading to float32', async () => {
		// Use direct DataView float64 access here instead of moduleTesterWithFunctions:
		// its shared test memory helpers currently coerce non-integer values through float32.
		const result = compile(
			[
				{
					code: [
						'module test',
						'float64 input',
						'float64 output',
						'loop',
						'  push &output',
						'  push input',
						'  call axion',
						'  store',
						'loopEnd',
						'moduleEnd',
					],
				},
			],
			{
				startingMemoryWordAddress: 0,
				disableSharedMemory: true,
			},
			[
				{
					code: ['function axion', 'param float64 x', 'push x', 'functionEnd float64'],
				},
			]
		);

		const module = result.compiledModules[Object.keys(result.compiledModules)[0]];
		const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: false });
		const dataView = new DataView(memoryRef.buffer);
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
			js: { memory: memoryRef },
		});

		const init = instance.exports.init as CallableFunction;
		const cycle = instance.exports.cycle as CallableFunction;

		init();

		const inputAddress = module.memoryMap['input'].byteAddress;
		const outputAddress = module.memoryMap['output'].byteAddress;
		const value = Math.PI;

		dataView.setFloat64(inputAddress, value, true);
		cycle();

		expect(dataView.getFloat64(outputAddress, true)).toBeCloseTo(value, 12);
	});
});

moduleTesterWithFunctions(
	'call float64-returning function',
	`module test
float64 output

loop
  push &output
  call getDoublePI
  store
loopEnd

moduleEnd`,
	[
		`function getDoublePI
push 3.14159265358979f64
push 2.0f64
mul
functionEnd float64`,
	],
	[[{}, { output: 6.28318530717958 }]]
);

describe('call instruction (pointer params)', () => {
	test('supports pointer params, local pointer dereference, and sizeof(*param)', async () => {
		const testModule = await createTestModuleWithFunctions(
			`module test
float[] lut 32
float output 0
float delta 0

loop
  push &output
  push &lut
  push 0
  push delta
  call readScaledBlep
  store
loopEnd

moduleEnd`,
			[
				`function readScaledBlep
param float* lut
param int phaseIndex
param float delta

local float* lutPtr

push lut
push phaseIndex
push sizeof(*lut)
mul
add
localSet lutPtr

push *lutPtr
push delta
mul
functionEnd float`,
			]
		);

		const lutBase = testModule.memoryMap.lut.byteAddress;
		const dataView = new DataView(testModule.memory.buffer);

		for (let i = 0; i < 16; i++) {
			dataView.setFloat32(lutBase + i * 4, i + 1, true);
		}
		dataView.setFloat32(testModule.memoryMap.delta.byteAddress, 0.5, true);

		testModule.test();

		expect(dataView.getFloat32(testModule.memoryMap.output.byteAddress, true)).toBeCloseTo(0.5, 6);
	});
});
