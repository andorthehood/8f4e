import { compileToAST } from '@8f4e/tokenizer';
import { describe, expect, test } from 'vitest';

import { createSingleFunctionWASMProgram } from './testUtils';

import { compileModules } from '../../src';

async function instantiate(sourceCode: string) {
	const ast = compileToAST(sourceCode.split('\n'));
	if (ast.type === 'function') {
		throw new Error('Expected module AST.');
	}
	const mod = compileModules([ast], { startingMemoryWordAddress: 0 })[0];
	const program = createSingleFunctionWASMProgram(mod.cycleFunction);
	const memory = new WebAssembly.Memory({ initial: 1 });
	const dataView = new DataView(memory.buffer);
	const { instance } = await WebAssembly.instantiate(program, { js: { memory } });

	return { mod, dataView, instance };
}

describe('memoryCopy instruction', () => {
	test('copies bytes from source to destination', async () => {
		const { mod, dataView, instance } = await instantiate(`module memoryCopyTest
int[] source 5
int[] target 5
push &target
push &source
memoryCopy 20
moduleEnd`);

		const sourceBase = mod.memoryMap['source'].byteAddress;
		dataView.setInt32(sourceBase + 0, 10, true);
		dataView.setInt32(sourceBase + 4, 20, true);
		dataView.setInt32(sourceBase + 8, 30, true);
		dataView.setInt32(sourceBase + 12, 40, true);
		dataView.setInt32(sourceBase + 16, 50, true);

		(instance.exports.test as CallableFunction)();

		const targetBase = mod.memoryMap['target'].byteAddress;
		expect(dataView.getInt32(targetBase + 0, true)).toBe(10);
		expect(dataView.getInt32(targetBase + 4, true)).toBe(20);
		expect(dataView.getInt32(targetBase + 8, true)).toBe(30);
		expect(dataView.getInt32(targetBase + 12, true)).toBe(40);
		expect(dataView.getInt32(targetBase + 16, true)).toBe(50);
	});

	test('skips the whole copy when the source range is out of bounds', async () => {
		const { mod, dataView, instance } = await instantiate(`module guardedMemoryCopyTest
int[] source 2
int[] target 2
push &target
push &source
push 999999
add
memoryCopy 8
moduleEnd`);

		const targetBase = mod.memoryMap['target'].byteAddress;
		dataView.setInt32(targetBase + 0, 1, true);
		dataView.setInt32(targetBase + 4, 2, true);

		(instance.exports.test as CallableFunction)();

		expect(dataView.getInt32(targetBase + 0, true)).toBe(1);
		expect(dataView.getInt32(targetBase + 4, true)).toBe(2);
	});
});
