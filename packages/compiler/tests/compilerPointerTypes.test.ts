import { createFunctionId } from '@8f4e/compiler-spec';
import { describe, expect, test } from 'vitest';

import { getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

describe('compiler pointer types', () => {
	test('supports unsigned narrow pointer parameters', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

entry main
module unsignedPointerParam
int8u[] bytes 2 255
int output

push &output
push &bytes
call readUnsignedByte
store
moduleEnd
entryEnd

function readUnsignedByte
#impure
param int8u* bytes
push *bytes
functionEnd int
`);
		const memory = new DataView((fixture.host.memory as WebAssembly.Memory).buffer);
		const output = fixture.compileResult.compiledModules.unsignedPointerParam.memoryMap.output.byteAddress;

		getExportedFunction(fixture.instance.exports, 'initDefaults')();
		getExportedFunction(fixture.instance.exports, 'main')();

		expect(memory.getInt32(output, true)).toBe(255);
		const functionId = createFunctionId('readUnsignedByte', ['int8u*']);
		expect(fixture.compileResult.compiledFunctions![functionId].signature.parameters).toEqual(['int8u*']);
	});

	test('supports unsigned narrow pointer memory declarations', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

entry main
module unsignedPointerDeclaration
int8u[] bytes 2 255
int8u* cursor &bytes
int output

push &output
push *cursor
store
moduleEnd
entryEnd
`);
		const memory = new DataView((fixture.host.memory as WebAssembly.Memory).buffer);
		const module = fixture.compileResult.compiledModules.unsignedPointerDeclaration;
		const output = module.memoryMap.output.byteAddress;

		getExportedFunction(fixture.instance.exports, 'initDefaults')();
		getExportedFunction(fixture.instance.exports, 'main')();

		expect(memory.getInt32(output, true)).toBe(255);
		expect(module.memoryMap.cursor.pointeeBaseType).toBe('int8u');
	});
});
