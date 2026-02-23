import { describe, test, expect, beforeAll, beforeEach } from 'vitest';

import { createSingleFunctionWASMProgram } from './testUtils';

import { compileModules } from '../../src';
import { compileToAST } from '../../src/compiler';

import type { CompiledModule } from '../../src/types';

describe('storeBytes instruction', () => {
	let testModule: CompiledModule;
	let dataView: DataView;
	let instance: WebAssembly.Instance;

	// Pushes bytes first, then addr last (addr-last convention).
	// Pop order: 111 first → dst+0, then 108 → dst+1, 108 → dst+2, 101 → dst+3, 72 → dst+4
	const sourceCode = `module storeBytesTest

int8[] dest 8

push 72
push 101
push 108
push 108
push 111
push &dest
storeBytes 5

moduleEnd
`;

	beforeAll(async () => {
		const ast = compileToAST(sourceCode.split('\n'));
		testModule = compileModules([ast], {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
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
		new Uint8Array(dataView.buffer).fill(0);
	});

	test('writes bytes in pop order (top-of-stack to dst+0)', () => {
		(instance.exports.test as CallableFunction)();

		const base = testModule.memoryMap['dest'].byteAddress;
		expect(dataView.getUint8(base + 0)).toBe(111); // 'o' — top of stack, first pop
		expect(dataView.getUint8(base + 1)).toBe(108); // 'l'
		expect(dataView.getUint8(base + 2)).toBe(108); // 'l'
		expect(dataView.getUint8(base + 3)).toBe(101); // 'e'
		expect(dataView.getUint8(base + 4)).toBe(72); // 'H' — bottom byte, last pop
	});

	test('does not write beyond the given count', () => {
		(instance.exports.test as CallableFunction)();

		const base = testModule.memoryMap['dest'].byteAddress;
		expect(dataView.getUint8(base + 5)).toBe(0);
	});
});

describe('storeBytes truncates values to byte', () => {
	test('stores only the low byte of values larger than 255', async () => {
		const ast = compileToAST(
			`module storeBytesOverflow
int8[] buf 4
push 256
push 257
push &buf
storeBytes 2
moduleEnd`.split('\n')
		);
		const mod = compileModules([ast], { startingMemoryWordAddress: 0, memorySizeBytes: 65536 })[0];
		const program = createSingleFunctionWASMProgram(mod.cycleFunction);

		const memory = new WebAssembly.Memory({ initial: 1 });
		const dv = new DataView(memory.buffer);
		const { instance } = await WebAssembly.instantiate(program, { js: { memory } });
		(instance.exports.test as CallableFunction)();

		const base = mod.memoryMap['buf'].byteAddress;
		// Pop order: 257 first → dst+0, 256 → dst+1
		expect(dv.getUint8(base + 0)).toBe(1); // 257 & 0xff == 1
		expect(dv.getUint8(base + 1)).toBe(0); // 256 & 0xff == 0
	});
});

describe('storeBytes with count 0 drops the address', () => {
	test('storeBytes 0 compiles and leaves memory unchanged', async () => {
		const ast = compileToAST(
			`module storeBytes0
int dest
init dest 42
push &dest
storeBytes 0
moduleEnd`.split('\n')
		);
		const mod = compileModules([ast], { startingMemoryWordAddress: 0, memorySizeBytes: 65536 })[0];
		const program = createSingleFunctionWASMProgram(mod.cycleFunction);

		const memory = new WebAssembly.Memory({ initial: 1 });
		const dv = new DataView(memory.buffer);

		// Pre-write dest value to check it remains unchanged after storeBytes 0
		dv.setInt32(mod.memoryMap['dest'].byteAddress, 42, true);

		const { instance } = await WebAssembly.instantiate(program, { js: { memory } });
		(instance.exports.test as CallableFunction)();

		// storeBytes 0 should not modify dest
		expect(dv.getInt32(mod.memoryMap['dest'].byteAddress, true)).toBe(42);
	});
});
