import instructionParser from './instructionParser';

/**
 * Extracts dependency identifiers from `use` instructions in source code.
 * Keeps source order and deduplicates repeated entries.
 */
export default function extractUseDependencies(source: string): string[] {
	const dependencies: string[] = [];
	const seen = new Set<string>();

	for (const line of source.split(/\r?\n/)) {
		const [, instruction, dependency] = line.match(instructionParser) || [];
		if (instruction !== 'use' || !dependency || seen.has(dependency)) {
			continue;
		}

		seen.add(dependency);
		dependencies.push(dependency);
	}

	return dependencies;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractUseDependencies', () => {
		it('extracts dependencies from use instructions', () => {
			expect(
				extractUseDependencies(`module test
use math
use sine
moduleEnd`)
			).toEqual(['math', 'sine']);
		});

		it('deduplicates repeated use instructions', () => {
			expect(
				extractUseDependencies(`module test
use math
use math
moduleEnd`)
			).toEqual(['math']);
		});

		it('ignores commented and malformed lines', () => {
			expect(
				extractUseDependencies(`module test
; use notARealDependency
use
use env ; built-in
moduleEnd`)
			).toEqual(['env']);
		});
	});
}
