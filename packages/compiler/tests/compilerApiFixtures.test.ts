import { describe, expect, test } from 'vitest';
import wabt from 'wabt';

import { compileFixtureProgramSource, getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

async function compileToWat(codeBuffer: Uint8Array): Promise<string> {
	const wabtApi = await wabt();
	const module = wabtApi.readWasm(codeBuffer, {});
	return module.toText({});
}

describe('compiler API fixture helpers', () => {
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
		const scratch = fixture.compileResult.compiledModules.resettableDefaults.memoryMap.scratch;
		const marker = fixture.compileResult.compiledModules.resettableDefaults.memoryMap.marker;
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

	test('keeps sparse array initializers compact in the emitted wasm', () => {
		const { compileResult } = compileFixtureProgramSource(`
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
		const { compileResult } = compileFixtureProgramSource(`
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

	test('exposes AST and stack analysis only when requested', () => {
		const source = `
8f4e/v1

entry main
module optionSurface
int output
push &output
push 1
store
moduleEnd
entryEnd

function double
param int value
push value
push value
add
functionEnd int
`;
		const defaultResult = compileFixtureProgramSource(source).compileResult;
		const analyzedResult = compileFixtureProgramSource(source, {
			includeAST: true,
			includeStackAnalysis: true,
		}).compileResult;

		expect(defaultResult.compiledModules.optionSurface.ast).toBeUndefined();
		expect(defaultResult.compiledModules.optionSurface.stackAnalysis).toBeUndefined();
		expect(defaultResult.compiledFunctions!.double.stackAnalysis).toBeUndefined();

		expect(analyzedResult.compiledModules.optionSurface.ast?.id).toBe('optionSurface');
		expect(analyzedResult.compiledModules.optionSurface.stackAnalysis?.map(line => line.instruction)).toEqual([
			'push',
			'push',
			'store',
		]);
		expect(analyzedResult.compiledFunctions!.double.stackAnalysis?.map(line => line.instruction)).toEqual([
			'function',
			'param',
			'push',
			'push',
			'add',
			'functionEnd',
		]);
	});

	test('reuses cached AST entries when recompiling unchanged source', () => {
		const source = `
8f4e/v1

entry main
module cachedModule
int value 1
moduleEnd
entryEnd

function cachedFunction
push 1
functionEnd int
`;
		const first = compileFixtureProgramSource(source, { includeAST: true });
		const cachedModuleAst = first.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast;
		const cachedFunctionAst = first.compileResult.cache.ast.entries.get('function:0')?.ast;
		const second = compileFixtureProgramSource(source, {
			includeAST: true,
			cache: first.compileResult.cache,
		});

		expect(second.compileResult.cache).toBe(first.compileResult.cache);
		expect(second.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast).toBe(cachedModuleAst);
		expect(second.compileResult.cache.ast.entries.get('function:0')?.ast).toBe(cachedFunctionAst);
		expect(second.compileResult.cache.ast.stats.hits).toBeGreaterThanOrEqual(2);
	});

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
