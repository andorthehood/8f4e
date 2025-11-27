import { describe, test, expect } from 'vitest';

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
				memorySizeBytes: 65536,
				includeAST: true,
			})
		).toMatchSnapshot();
	});

	test('compile function excludes AST by default', () => {
		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			memorySizeBytes: 65536,
		});

		// Verify that none of the compiled modules have an ast property
		for (const [, module] of Object.entries(result.compiledModules)) {
			expect(module.ast).toBeUndefined();
		}
	});

	test('compile function includes AST when includeAST is true', () => {
		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			memorySizeBytes: 65536,
			includeAST: true,
		});

		// Verify that all compiled modules have an ast property
		for (const [, module] of Object.entries(result.compiledModules)) {
			expect(module.ast).toBeDefined();
			expect(Array.isArray(module.ast)).toBe(true);
		}
	});
});
