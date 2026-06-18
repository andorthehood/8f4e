import { describe, expect, test } from 'vitest';
import wabt from 'wabt';

import { compileFixtureProgramSource, getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

async function compileToWat(codeBuffer: Uint8Array): Promise<string> {
	const wabtApi = await wabt();
	const module = wabtApi.readWasm(codeBuffer, {});
	return module.toText({});
}

describe('compiler memory initialization', () => {
	test('allows repeated initDefaults calls to verify reset behavior after mutation', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

entry main
module resettableDefaults
int[] scratch 4
int marker 123

push &scratch
push 99
store

push &marker
push 456
store
moduleEnd
entryEnd
`);
		const memory = new Int32Array((fixture.host.memory as WebAssembly.Memory).buffer);
		const plannedModule = fixture.compileResult.memoryPlan.modules.resettableDefaults!;
		const scratch = plannedModule.memory.scratch!;
		const marker = plannedModule.memory.marker!;
		const initDefaults = getExportedFunction(fixture.instance.exports, 'initDefaults');
		const main = getExportedFunction(fixture.instance.exports, 'main');

		initDefaults();
		expect(memory[scratch.wordAlignedAddress]).toBe(0);
		expect(memory[marker.wordAlignedAddress]).toBe(123);

		main();
		expect(memory[scratch.wordAlignedAddress]).toBe(99);
		expect(memory[marker.wordAlignedAddress]).toBe(456);

		initDefaults();
		expect(memory[scratch.wordAlignedAddress]).toBe(0);
		expect(memory[marker.wordAlignedAddress]).toBe(123);
	});

	test('keeps sparse array initializers compact in the emitted wasm', async () => {
		const { compileResult } = await compileFixtureProgramSource(`
8f4e/v1

entry main
module hugeSparseArray
int[] huge 1000000 1
moduleEnd
entryEnd
`);

		expect(compileResult.codeBuffer.byteLength).toBeLessThan(10_000);
	});

	test('emits memory.fill before loading passive data defaults', async () => {
		const { compileResult } = await compileFixtureProgramSource(`
8f4e/v1

entry main
module memoryInitializationOrder
int implicitZero
int explicitValue 5
int[] implicitArray 4
moduleEnd
entryEnd
`);
		const wat = await compileToWat(compileResult.codeBuffer);
		const fillIndex = wat.indexOf('memory.fill');
		const memoryInitIndex = wat.indexOf('memory.init');

		expect(fillIndex).toBeGreaterThan(-1);
		expect(memoryInitIndex).toBeGreaterThan(-1);
		expect(fillIndex).toBeLessThan(memoryInitIndex);
		expect(wat.match(/memory\.fill/g)).toHaveLength(1);
		expect(wat).toContain(`i32.const ${compileResult.requiredMemoryBytes}`);
	});
});
