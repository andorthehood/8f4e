import { describe, expect, test } from 'vitest';

import { getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

describe('compiler injected blocks', () => {
	test('accepts prototype blocks injected through the compiler API path', async () => {
		const fixture = await instantiateFixtureProgramSource(
			`
8f4e/v1

entry main
module injectedPrototypeCaller
int output
shape injectedState

push &output
push 7
push 10
add
store
moduleEnd
entryEnd
`,
			{
				extraCodeBlocks: [{ id: -10, code: ['prototype injectedState', 'int value', 'prototypeEnd'] }],
			}
		);
		const memory = new DataView((fixture.host.memory as WebAssembly.Memory).buffer);
		const output = fixture.compileResult.compiledModules.injectedPrototypeCaller.memoryMap.output.byteAddress;
		const injectedValue = fixture.compileResult.compiledModules.injectedPrototypeCaller.memoryMap.value.byteAddress;

		getExportedFunction(fixture.instance.exports, 'initDefaults')();
		getExportedFunction(fixture.instance.exports, 'main')();

		expect(memory.getInt32(output, true)).toBe(17);
		expect(memory.getInt32(injectedValue, true)).toBe(0);
	});
});
