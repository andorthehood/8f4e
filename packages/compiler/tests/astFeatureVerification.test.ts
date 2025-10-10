import compile from '../src';

const testModule = {
	code: [
		'module test',
		'',
		'int out 0',
		'local int temp',
		'',
		'push 42',
		'localSet temp',
		'localGet temp',
		'push &out',
		'store',
		'moduleEnd',
	],
};

describe('AST optional output feature manual verification', () => {
	test('Default behavior excludes AST', () => {
		const result = compile([testModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
		});

		const firstModule = Object.values(result.compiledModules)[0];
		expect(firstModule).not.toHaveProperty('ast');
		expect(firstModule.ast).toBeUndefined();
	});

	test('Explicit includeAST: false excludes AST', () => {
		const result = compile([testModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			includeAST: false,
		});

		const firstModule = Object.values(result.compiledModules)[0];
		expect(firstModule).not.toHaveProperty('ast');
		expect(firstModule.ast).toBeUndefined();
	});

	test('includeAST: true includes AST', () => {
		const result = compile([testModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			includeAST: true,
		});

		const firstModule = Object.values(result.compiledModules)[0];
		expect(firstModule).toHaveProperty('ast');
		expect(firstModule.ast).toBeDefined();
		expect(Array.isArray(firstModule.ast)).toBe(true);
		expect(firstModule.ast!.length).toBeGreaterThan(0);

		// Check that the first instruction is the module declaration
		expect(firstModule.ast![0].instruction).toBe('module');
		expect(firstModule.ast![0].arguments[0].value).toBe('test');
	});
});
