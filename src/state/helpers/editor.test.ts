import { backSpace, moveCaret, type } from './editor';

const testCode = ['lorem', 'ipsum 1', 'dolor sit 0', 'amet'];

describe('moveCaret', () => {
	test('up', () => {
		expect(moveCaret(testCode, 0, 0, 'up')).toStrictEqual([0, 0]);
		expect(moveCaret(testCode, 1, 0, 'up')).toStrictEqual([0, 0]);
		expect(moveCaret(testCode, 1, 7, 'up')).toStrictEqual([0, 5]);
		expect(moveCaret(testCode, 2, 7, 'up')).toStrictEqual([1, 7]);
	});

	test('down', () => {
		expect(moveCaret(testCode, 0, 0, 'down')).toStrictEqual([1, 0]);
		expect(moveCaret(testCode, 3, 0, 'down')).toStrictEqual([3, 0]);
		expect(moveCaret(testCode, 0, 3, 'down')).toStrictEqual([1, 3]);
		expect(moveCaret(testCode, 2, 11, 'down')).toStrictEqual([3, 4]);
	});

	test('right', () => {
		expect(moveCaret(testCode, 0, 0, 'right')).toStrictEqual([0, 1]);
		expect(moveCaret(testCode, 0, 5, 'right')).toStrictEqual([0, 5]);
	});

	test('left', () => {
		expect(moveCaret(testCode, 0, 0, 'left')).toStrictEqual([0, 0]);
		expect(moveCaret(testCode, 0, 5, 'left')).toStrictEqual([0, 4]);
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
