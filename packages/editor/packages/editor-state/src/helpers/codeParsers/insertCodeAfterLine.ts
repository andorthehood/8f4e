import lineToRegexString from './lineToRegexString';

/**
 * Inserts new code immediately after the first line that matches a template string.
 * @param lineToFind - Template used to locate the insertion anchor.
 * @param code - Existing code represented as an array of lines.
 * @param codeToInsert - Lines to splice into the source.
 * @returns New code array with the insertion applied.
 */
export default function insertCodeAfterLine(lineToFind: string, code: string[], codeToInsert: string[]) {
	const regexp = new RegExp(lineToRegexString(lineToFind), 'gm');

	const indexToInsert =
		code.findIndex(line => {
			return regexp.test(line);
		}) + 1;

	return [...code.slice(0, indexToInsert), ...codeToInsert, ...code.slice(indexToInsert)];
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('insertCodeAfterLine', () => {
		const fixtures: [string, string[], string[], string[]][] = [
			['push 2', ['push 1', 'push 2'], ['push 3'], ['push 1', 'push 2', 'push 3']],
			['push 1', ['push 1', 'push 3'], ['push 2'], ['push 1', 'push 2', 'push 3']],
		];

		test.each(fixtures)('line: %s code: %s insert: %s', (lineToFind, codeSample, codeToInsert, result) => {
			expect(insertCodeAfterLine(lineToFind, codeSample, codeToInsert)).toEqual(result);
		});
	});
}
