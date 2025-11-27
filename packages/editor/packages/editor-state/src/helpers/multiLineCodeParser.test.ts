import { describe, test, expect } from 'vitest';

import { insertCodeAfterLine, parseCode, replaceCode } from './multiLineCodeParser';

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

	test.each(fixtures)('given code: %s and pattern: %s, the expected result is %s', (code, pattern, result) => {
		expect(parseCode(code, pattern)).toEqual(result);
	});
});

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

	test.each(fixtures)('given code: %s and pattern: %s, the expected result is %s', (code, pattern, result) => {
		expect(replaceCode(code, pattern, [])).toEqual(result);
	});
});

describe('insertCodeAfterLine', () => {
	const fixtures: [string, string[], string[], string[]][] = [
		['push 2', ['push 1', 'push 2'], ['push 3'], ['push 1', 'push 2', 'push 3']],
		['push 1', ['push 1', 'push 3'], ['push 2'], ['push 1', 'push 2', 'push 3']],
	];

	test.each(fixtures)(
		'given line: %s code: %s, and code to insert: %s the expected result is %s',
		(lineToFind, code, codeToInsert, result) => {
			expect(insertCodeAfterLine(lineToFind, code, codeToInsert)).toEqual(result);
		}
	);
});
