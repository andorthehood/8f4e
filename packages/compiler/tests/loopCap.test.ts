import { describe, expect, test } from 'vitest';
import { SyntaxErrorCode } from '@8f4e/tokenizer';

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

		const result = compile({ entries: { main: modules } }, { startingMemoryWordAddress: 1 });

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
			compile({ entries: { main: modules }, functions: functions }, { startingMemoryWordAddress: 1 });
		}).not.toThrow();
	});

	test('#loopCap in constants block throws error', () => {
		const constants = [
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
			compile({ entries: { main: [] }, constants }, { startingMemoryWordAddress: 1 });
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
			compile({ entries: { main: modules } }, { startingMemoryWordAddress: 1 });
		}).toThrow();
	});

	test('rejects #loopCap after declarations', () => {
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

		expect(() => compile({ entries: { main: modules } }, { startingMemoryWordAddress: 1 })).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE })
		);
	});
});

test('loop rejects a resolved negative cap', () => {
	const modules = [
		{
			code: `
module test
const LOOP_COUNT -1
loop LOOP_COUNT
loopEnd
moduleEnd
`.split('\n'),
		},
	];

	expect(() => compile({ entries: { main: modules } }, { startingMemoryWordAddress: 1 })).toThrow();
});

test('loop rejects a resolved float cap', () => {
	const modules = [
		{
			code: `
module test
const LOOP_COUNT 1.5
loop LOOP_COUNT
loopEnd
moduleEnd
`.split('\n'),
		},
	];

	expect(() => compile({ entries: { main: modules } }, { startingMemoryWordAddress: 1 })).toThrow();
});
