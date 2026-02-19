import { describe, test, expect, beforeAll, beforeEach } from 'vitest';

import { createSingleFunctionWASMProgram } from './testUtils';

import { compileModules } from '../../src';
import { compileToAST } from '../../src/compiler';

import type { CompiledModule } from '../../src/types';

describe('store instruction (float64)', () => {
	let testModule: CompiledModule;
	let dataView: DataView;
	let instance: WebAssembly.Instance;

	const sourceCode = `module storeF64

float64 dest
float64 src

push &dest
push src
store

moduleEnd
`;

	beforeAll(async () => {
		const ast = compileToAST(sourceCode.split('\n'));
		testModule = compileModules([ast], {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
			includeAST: true,
		})[0];

		const program = createSingleFunctionWASMProgram(testModule.cycleFunction);
		const memoryRef = new WebAssembly.Memory({ initial: 1 });
		dataView = new DataView(memoryRef.buffer);

		const result = (await WebAssembly.instantiate(program, {
			js: { memory: memoryRef },
		})) as unknown as WebAssembly.WebAssemblyInstantiatedSource;
		instance = result.instance;
	});

	beforeEach(() => {
		// Reset memory to zero
		new Uint8Array(dataView.buffer).fill(0);
	});

	test('stores a float64 value to float64 memory via safe address', () => {
		const destItem = testModule.memoryMap['dest'];
		const srcItem = testModule.memoryMap['src'];

		// Write 1.5 to src as float64
		dataView.setFloat64(srcItem.byteAddress, 1.5, true);

		(instance.exports.test as CallableFunction)();

		// Read dest as float64
		const result = dataView.getFloat64(destItem.byteAddress, true);
		expect(result).toBeCloseTo(1.5);
	});

	test('float64 memory items have byteAddress divisible by 8', () => {
		expect(testModule.memoryMap['dest'].byteAddress % 8).toBe(0);
		expect(testModule.memoryMap['src'].byteAddress % 8).toBe(0);
	});
});

describe('store instruction (int32 and float32 paths unchanged)', () => {
	test('int32 store still uses i32.store (opcode 54)', async () => {
		const ast = compileToAST(
			`module storeInt
int dest
int src
push &dest
push src
store
moduleEnd`.split('\n')
		);
		const mod = compileModules([ast], { startingMemoryWordAddress: 0, memorySizeBytes: 65536 })[0];
		const program = createSingleFunctionWASMProgram(mod.cycleFunction);

		const memory = new WebAssembly.Memory({ initial: 1 });
		const dv = new DataView(memory.buffer);
		const { instance } = await WebAssembly.instantiate(program, { js: { memory } });
		const test = instance.exports.test as CallableFunction;

		dv.setInt32(mod.memoryMap['src'].byteAddress, 42, true);
		test();
		expect(dv.getInt32(mod.memoryMap['dest'].byteAddress, true)).toBe(42);
	});

	test('float32 store still uses f32.store (opcode 56)', async () => {
		const ast = compileToAST(
			`module storeFloat
float dest
float src
push &dest
push src
store
moduleEnd`.split('\n')
		);
		const mod = compileModules([ast], { startingMemoryWordAddress: 0, memorySizeBytes: 65536 })[0];
		const program = createSingleFunctionWASMProgram(mod.cycleFunction);

		const memory = new WebAssembly.Memory({ initial: 1 });
		const dv = new DataView(memory.buffer);
		const { instance } = await WebAssembly.instantiate(program, { js: { memory } });
		const test = instance.exports.test as CallableFunction;

		dv.setFloat32(mod.memoryMap['src'].byteAddress, 3.14, true);
		test();
		expect(dv.getFloat32(mod.memoryMap['dest'].byteAddress, true)).toBeCloseTo(3.14, 4);
	});
});
