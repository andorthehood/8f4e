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
