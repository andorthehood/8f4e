import { describe, expect, test } from 'vitest';

import { getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

describe('compiler host imports', () => {
	test('supports custom host imports with side effects and return values', async () => {
		const calls: number[] = [];
		const fixture = await instantiateFixtureProgramSource(
			`
8f4e/v1

entry main
module hostImportCaller
int output

push 41
call record

push &output
push 41
call addOne
store
moduleEnd
entryEnd

function record
#import record
param int value
functionEnd

function addOne
#import "add.one"
param int value
functionEnd int
`,
			{
				includeAST: true,
				hostImports: {
					record: (value: number) => calls.push(value),
					'add.one': (value: number) => value + 1,
				},
			}
		);
		const memory = fixture.host.memory as WebAssembly.Memory;
		const output = fixture.compileResult.compiledModules.hostImportCaller.memoryMap.output.byteAddress;

		getExportedFunction(fixture.instance.exports, 'initDefaults')();
		getExportedFunction(fixture.instance.exports, 'main')();

		expect(calls).toEqual([41]);
		expect(new DataView(memory.buffer).getInt32(output, true)).toBe(42);
		expect(fixture.compileResult.compiledFunctions!.record.import).toEqual({
			moduleName: 'host',
			fieldName: 'record',
		});
		expect(fixture.compileResult.compiledFunctions!.addOne.import).toEqual({
			moduleName: 'host',
			fieldName: 'add.one',
		});
	});

	test('inlines call arguments as pushes before invoking custom functions', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

entry main
module inlineCallArguments
float output

push &output
call mix 2 1.5
store
moduleEnd
entryEnd

function mix
param int left
param float right
push left
castToFloat
push right
add
functionEnd float
`);
		const memory = new DataView((fixture.host.memory as WebAssembly.Memory).buffer);
		const output = fixture.compileResult.compiledModules.inlineCallArguments.memoryMap.output.byteAddress;

		getExportedFunction(fixture.instance.exports, 'initDefaults')();
		getExportedFunction(fixture.instance.exports, 'main')();

		expect(memory.getFloat32(output, true)).toBe(3.5);
	});
});
