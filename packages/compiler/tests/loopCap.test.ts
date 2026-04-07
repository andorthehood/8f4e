import { describe, test, expect } from 'vitest';

import { moduleTester } from './instructions/testUtils';

import compile from '../src/index';

describe('#loopCap directive', () => {
	test('module-scoped #loopCap changes the default cap for subsequent loops', () => {
		const modules = [
			{
				code: `
module test
#loopCap 500
int counter 0
loop
 push &counter
 push counter
 push 1
 add
 store
loopEnd
moduleEnd
`.split('\n'),
			},
		];

		const result = compile(modules, { startingMemoryWordAddress: 1 });

		// Module should compile successfully
		expect(result.compiledModules.test).toBeDefined();
	});

	test('function-scoped #loopCap is accepted', () => {
		const modules = [
			{
				code: `
module testModule
int counter 0
moduleEnd
`.split('\n'),
			},
		];

		const functions = [
			{
				code: `
function testFunc
#loopCap 2048
functionEnd
`.split('\n'),
			},
		];

		// Should compile without error
		expect(() => {
			compile(modules, { startingMemoryWordAddress: 1 }, functions);
		}).not.toThrow();
	});

	test('#loopCap in constants block throws error', () => {
		const modules = [
			{
				code: `
constants env
#loopCap 500
const SAMPLE_RATE 48000
constantsEnd
`.split('\n'),
			},
		];

		expect(() => {
			compile(modules, { startingMemoryWordAddress: 1 });
		}).toThrow();
	});

	test('#loopCap at top-level (outside module) throws error', () => {
		const modules = [
			{
				code: `
#loopCap 500
module test
int counter 0
moduleEnd
`.split('\n'),
			},
		];

		expect(() => {
			compile(modules, { startingMemoryWordAddress: 1 });
		}).toThrow();
	});

	test('#loopCap only affects loops declared after it', () => {
		const modules = [
			{
				code: `
module test
int counter 0
#loopCap 500
int counter2 0
loop
 push &counter
 push counter
 push 1
 add
 store
loopEnd
moduleEnd
`.split('\n'),
			},
		];

		// Should compile without error — #loopCap affects the loop after it
		const result = compile(modules, { startingMemoryWordAddress: 1 });
		expect(result.compiledModules.test).toBeDefined();
	});
});

// Runtime behavior tests
moduleTester(
	'plain loop still stops at default cap of 1000',
	`module loop
int counter

loop
 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 1000 }]]
);

moduleTester(
	'#loopCap changes the default cap for subsequent loops',
	`module loop
int counter
#loopCap 500

loop
 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 500 }]]
);

moduleTester(
	'loop with explicit cap argument overrides default cap',
	`module loop
int counter

loop 32
 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 32 }]]
);

moduleTester(
	'loop with explicit cap argument overrides #loopCap',
	`module loop
int counter
#loopCap 500

loop 12
 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 12 }]]
);

moduleTester(
	'#loopCap does not affect loops declared before it',
	`module loop
int counter
int counter2

loop
 push &counter
 push counter
 push 1
 add
 store
loopEnd

#loopCap 500

loop
 push &counter2
 push counter2
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 1000, counter2: 500 }]]
);

moduleTester(
	'nested loops resolve their own caps independently',
	`module loop
int outerCounter
int innerCounter

loop 5
 push &outerCounter
 push outerCounter
 push 1
 add
 store

 loop 3
  push &innerCounter
  push innerCounter
  push 1
  add
  store
 loopEnd

loopEnd

moduleEnd
`,
	[[{}, { outerCounter: 5, innerCounter: 15 }]]
);

moduleTester(
	'loop cap of 0 causes loop to exit immediately on first guard check',
	`module loop
int counter

loop 0
 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 0 }]]
);
