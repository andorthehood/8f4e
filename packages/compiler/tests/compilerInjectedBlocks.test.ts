import { describe, expect, test } from 'vitest';

import { getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

describe('compiler injected blocks', () => {
	test('accepts macro blocks injected through the compiler API path', async () => {
		const fixture = await instantiateFixtureProgramSource(
			`
8f4e/v1

entry main
module injectedMacroCaller
int output

push &output
push 7
macro addTen
store
moduleEnd
entryEnd
`,
			{
				extraCodeBlocks: [{ code: ['defineMacro addTen', 'push 10', 'add', 'defineMacroEnd'] }],
			}
		);
		const memory = new DataView((fixture.host.memory as WebAssembly.Memory).buffer);
		const output = fixture.compileResult.compiledModules.injectedMacroCaller.memoryMap.output.byteAddress;

		getExportedFunction(fixture.instance.exports, 'initDefaults')();
		getExportedFunction(fixture.instance.exports, 'main')();

		expect(memory.getInt32(output, true)).toBe(17);
	});
});
