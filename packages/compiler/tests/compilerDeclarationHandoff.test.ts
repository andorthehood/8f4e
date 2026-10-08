import { createFunctionId } from '@8f4e/language-spec';
import { describe, expect, test } from 'vitest';
import { getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

describe('resolved declarations and backend local storage', () => {
	test('keeps earlier bindings when later declarations reuse a parameter name and change its type', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

function bindingSlots
#export
param int value
push value
abs
local int value
push 7
localSet value
push value
local float value
push 2.5
localSet value
push value
functionEnd int int float
`);
		expect(getExportedFunction(fixture.instance.exports, 'bindingSlots')(-11)).toEqual([11, 7, 2.5]);
		const compiled = fixture.compileResult.compiledFunctions![createFunctionId('bindingSlots', ['int'])];
		expect(compiled.signature.parameters).toEqual(['int']);
		expect(compiled.locals.map(local => local.isInteger)).toEqual([true, false, true]);
	});

	test('normalizes directive caps while allocating loop counters independently of later source locals', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

function capped
#export
#loopCap 2
local int total
loop
loopIndex
localSet total
loopEnd
push total
local int late
loop 3
loopIndex
localSet late
loopEnd
push late
functionEnd int int
`);
		expect(getExportedFunction(fixture.instance.exports, 'capped')()).toEqual([1, 2]);
	});

	test('initializes skipped modules while leaving them out of their execution entry', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

entry main
module skipped
#skipExecution
int value 3
push &value
push 42
store
moduleEnd
entryEnd

`);
		const memory = new DataView((fixture.host.memory as WebAssembly.Memory).buffer);
		const address = fixture.compileResult.memoryPlan.modules.skipped.memory.value.byteAddress;
		getExportedFunction(fixture.instance.exports, 'initDefaults')();
		getExportedFunction(fixture.instance.exports, 'main')();
		expect(memory.getInt32(address, true)).toBe(3);
	});
});
