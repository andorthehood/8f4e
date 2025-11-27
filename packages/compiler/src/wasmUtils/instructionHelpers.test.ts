import { test, expect } from 'vitest';

import { call, f32const, i32const, localGet, localSet } from './instructionHelpers';

test('localGet', () => {
	expect(localGet(1)).toStrictEqual([32, 1]);
	expect(localGet(32)).toStrictEqual([32, 32]);
	expect(localGet(256)).toStrictEqual([32, 128, 2]);
});

test('localSet', () => {
	expect(localSet(1)).toStrictEqual([33, 1]);
	expect(localSet(32)).toStrictEqual([33, 32]);
	expect(localSet(256)).toStrictEqual([33, 128, 2]);
});

test('call', () => {
	expect(call(1)).toStrictEqual([16, 1]);
	expect(call(32)).toStrictEqual([16, 32]);
	expect(call(256)).toStrictEqual([16, 128, 2]);
});

test('i32const', () => {
	expect(i32const(1)).toStrictEqual([65, 1]);
	expect(i32const(32)).toStrictEqual([65, 32]);
	expect(i32const(256)).toStrictEqual([65, 128, 2]);
	expect(i32const(-1)).toStrictEqual([65, 127]);
	expect(i32const(-256)).toStrictEqual([65, 128, 126]);
});

test('f32const', () => {
	expect(f32const(1)).toStrictEqual([67, 0, 0, 128, 63]);
	expect(f32const(32)).toStrictEqual([67, 0, 0, 0, 66]);
	expect(f32const(256)).toStrictEqual([67, 0, 0, 128, 67]);
	expect(f32const(-1)).toStrictEqual([67, 0, 0, 128, 191]);
	expect(f32const(-256)).toStrictEqual([67, 0, 0, 128, 195]);
	expect(f32const(3.14)).toStrictEqual([67, 195, 245, 72, 64]);
});
