import { describe, expect, test } from 'vitest';
import wabt from 'wabt';

import compile from '../src';

async function compileToWat(codeBuffer: Uint8Array): Promise<string> {
	const wabtApi = await wabt();
	const module = wabtApi.readWasm(codeBuffer, {});
	return module.toText({});
}

describe('memory initialization', () => {
	test('init clears program memory once before loading passive data segments', async () => {
		const result = compile(
			[
				{
					code: ['module test', 'int implicitZero', 'int explicitValue 5', 'int[] implicitArray 4', 'moduleEnd'],
				},
			],
			{ disableSharedMemory: true }
		);
		const wat = await compileToWat(result.codeBuffer);
		const fillIndex = wat.indexOf('memory.fill');
		const memoryInitIndex = wat.indexOf('memory.init');

		expect(fillIndex).toBeGreaterThan(-1);
		expect(memoryInitIndex).toBeGreaterThan(-1);
		expect(fillIndex).toBeLessThan(memoryInitIndex);
		expect(wat.match(/memory\.fill/g)).toHaveLength(1);
		expect(wat).toContain(`i32.const ${result.requiredMemoryBytes}`);
	});
});
