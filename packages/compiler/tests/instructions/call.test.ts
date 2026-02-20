import { describe, test, expect } from 'vitest';

import { moduleTesterWithFunctions } from './testUtils';

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
localGet x
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
				memorySizeBytes: 65536,
				disableSharedMemory: true,
			},
			[
				{
					code: ['function axion', 'param float64 x', 'localGet x', 'functionEnd float64'],
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
