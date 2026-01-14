import codeToRegex from './codeToRegex';

/**
 * Removes or replaces code segments that match a template pattern.
 * @param code - Source code to modify, represented as an array of lines.
 * @param pattern - Template lines that identify the code to replace.
 * @param replaceWith - Lines that should substitute the matched block.
 * @returns Updated code array with replacements applied.
 */
export default function replaceCode(code: string[], pattern: string[], replaceWith: string[]) {
	const newCode = code
		.filter(line => !/^\s*$/gm.test(line))
		.join('\n')
		.replace(codeToRegex(pattern), replaceWith.join('\n'));

	if (newCode === '') {
		return [];
	}
	return newCode.split('\n');
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('replaceCode', () => {
		const fixtures: [string[], string[], string[]][] = [
			[[`push 1`, `push 2`], [`push :index`, `push :key`], []],
			[[`push   8`, `push    21`], [`push :index`, `push :key`], []],
			[[`  push  10`, ` push  8 `, `  push    300`], [`push :index`, `push 8`, `push :key`], []],
			[
				[' push 1', `  push  10`, ` push  8 `, ' ', '', `  push    300`],
				[`push :index`, `push 8`, `push :key`],
				[' push 1'],
			],
			[
				[' push 1', `  push  10`, ` push  8 `, ' ', '', `  push    300`, 'push WORD_SIZE'],
				[`push :index`, `push 8`, `push :key`],
				[' push 1', 'push WORD_SIZE'],
			],
		];

		test.each(fixtures)('replaces %s using pattern %s', (codeSample, pattern, result) => {
			expect(replaceCode(codeSample, pattern, [])).toEqual(result);
		});
	});
}
