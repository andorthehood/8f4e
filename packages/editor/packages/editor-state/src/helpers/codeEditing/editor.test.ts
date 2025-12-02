import { describe, test, expect } from 'vitest';

import { backSpace, generateCodeColorMap, moveCaret, type } from './editor';

const testCode = ['lorem', 'ipsum 1', 'dolor sit 0', 'amet'];

describe('moveCaret', () => {
	test('ArrowUp', () => {
		expect(moveCaret(testCode, 0, 0, 'ArrowUp')).toStrictEqual([0, 0]);
		expect(moveCaret(testCode, 1, 0, 'ArrowUp')).toStrictEqual([0, 0]);
		expect(moveCaret(testCode, 1, 7, 'ArrowUp')).toStrictEqual([0, 5]);
		expect(moveCaret(testCode, 2, 7, 'ArrowUp')).toStrictEqual([1, 7]);
	});

	test('ArrowDown', () => {
		expect(moveCaret(testCode, 0, 0, 'ArrowDown')).toStrictEqual([1, 0]);
		expect(moveCaret(testCode, 3, 0, 'ArrowDown')).toStrictEqual([3, 0]);
		expect(moveCaret(testCode, 0, 3, 'ArrowDown')).toStrictEqual([1, 3]);
		expect(moveCaret(testCode, 2, 11, 'ArrowDown')).toStrictEqual([3, 4]);
	});

	test('ArrowRight', () => {
		expect(moveCaret(testCode, 0, 0, 'ArrowRight')).toStrictEqual([0, 1]);
		expect(moveCaret(testCode, 0, 5, 'ArrowRight')).toStrictEqual([0, 5]);
	});

	test('ArrowLeft', () => {
		expect(moveCaret(testCode, 0, 0, 'ArrowLeft')).toStrictEqual([0, 0]);
		expect(moveCaret(testCode, 0, 5, 'ArrowLeft')).toStrictEqual([0, 4]);
	});
});

describe('editing', () => {
	test('backSpace', () => {
		expect(backSpace(testCode, 0, 5)).toStrictEqual({
			code: ['lore', 'ipsum 1', 'dolor sit 0', 'amet'],
			row: 0,
			col: 4,
		});

		expect(backSpace(testCode, 0, 0)).toStrictEqual({
			code: ['lorem', 'ipsum 1', 'dolor sit 0', 'amet'],
			row: 0,
			col: 0,
		});
	});

	test('type', () => {
		expect(type(testCode, 0, 0, 'a')).toStrictEqual({
			code: ['alorem', 'ipsum 1', 'dolor sit 0', 'amet'],
			row: 0,
			col: 1,
		});
	});

	test('type', () => {
		expect(type(testCode, 0, 5, 'a')).toStrictEqual({
			code: ['lorema', 'ipsum 1', 'dolor sit 0', 'amet'],
			row: 0,
			col: 6,
		});
	});
});

const codeColorMapFixtures: string[] = ['001 int pointer 10'];

describe('generateCodeColorMap', () => {
	test.each(codeColorMapFixtures)('', code => {
		expect(
			generateCodeColorMap(
				[code],
				{
					fontLineNumber: 0,
					fontInstruction: 1,
					fontCode: 2,
					fontCodeComment: 3,
					fontNumbers: 4,
					fontBinaryZero: 5,
					fontBinaryOne: 6,
				},
				['int']
			)
		).toMatchSnapshot();
	});
});
