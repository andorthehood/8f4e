import modules from './__fixtures__/modules';

import { compileToAST } from '../src/compiler';
import { compileModules } from '../src';
import compile from '../src';

describe('compiler', () => {
	test('compileModules', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		expect(
			compileModules(astModules, {
				startingMemoryWordAddress: 0,
				environmentExtensions: { constants: {}, ignoredKeywords: [] },
				maxMemorySize: 1,
				initialMemorySize: 1,
				includeAST: true,
			})
		).toMatchSnapshot();
	});

	test('compileModules excludes AST when includeAST is false', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		const compiledModules = compileModules(astModules, {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			includeAST: false,
		});

		// Verify that none of the compiled modules have an ast property
		compiledModules.forEach(module => {
			expect(module.ast).toBeUndefined();
		});
	});

	test('compile function excludes AST by default', () => {
		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
		});

		// Verify that none of the compiled modules have an ast property
		for (const [, module] of result.compiledModules) {
			expect(module.ast).toBeUndefined();
		}
	});

	test('compile function includes AST when includeAST is true', () => {
		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			includeAST: true,
		});

		// Verify that all compiled modules have an ast property
		for (const [, module] of result.compiledModules) {
			expect(module.ast).toBeDefined();
			expect(Array.isArray(module.ast)).toBe(true);
		}
	});
});
