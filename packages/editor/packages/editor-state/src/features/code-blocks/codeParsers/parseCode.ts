import codeToRegex from './codeToRegex';

/**
 * Extracts structured data from a block of code using a multiline template pattern.
 * @param code - Source code to scan, expressed as an array of lines.
 * @param pattern - Template lines whose captures (e.g. :index) should be extracted.
 * @returns Array of capture group objects for each pattern match.
 */
export default function parseCode(code: string[], pattern: string[]) {
	const regex = codeToRegex(pattern);
	const codeWithoutEmptyLines = code.filter(line => !/^\s*$/gm.test(line)).join('\n');

	let groups: Record<string, string> | undefined;
	const data: Record<string, string>[] = [];

	while ((groups = regex.exec(codeWithoutEmptyLines)?.groups)) {
		data.push(groups);
	}

	return data;
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('parseCode', () => {
		const fixtures: [string[], string[], Record<string, string>[]][] = [
			[
				[`push 1`, `push 2`],
				[`push :index`, `push :key`],
				[
					{
						index: '1',
						key: '2',
					},
				],
			],
			[
				[`push   8`, `push    21`],
				[`push :index`, `push :key`],
				[
					{
						index: '8',
						key: '21',
					},
				],
			],
			[
				[`  push  10`, ` push  8 `, `  push    300`],
				[`push :index`, `push 8`, `push :key`],
				[
					{
						index: '10',
						key: '300',
					},
				],
			],
			[
				['push 1', `  push  10`, ` push  8 `, ' ', '', `  push    300`],
				[`push :index`, `push 8`, `push :key`],
				[
					{
						index: '10',
						key: '300',
					},
				],
			],
			[
				[`  push  10`, ` push  8 `, `  push    300`, `  push  11`, ` push  8 `, `  push    301`],
				[`push :index`, `push 8`, `push :key`],
				[
					{
						index: '10',
						key: '300',
					},
					{
						index: '11',
						key: '301',
					},
				],
			],
			[
				[`init buffer[11] 301`],
				[`init buffer[:index] :key`],
				[
					{
						index: '11',
						key: '301',
					},
				],
			],
		];

		test.each(fixtures)('matches %s using pattern %s', (codeSample, pattern, result) => {
			expect(parseCode(codeSample, pattern)).toEqual(result);
		});
	});
}
