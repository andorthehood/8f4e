import { describe, test, expect } from 'vitest';

import { createTestModule } from './testUtils';

describe('map: key type mismatch', () => {
	test('throws when float key used with int inputType', async () => {
		await expect(
			createTestModule(`module m
int x
push x
mapBegin int
  map 1.5 10
mapEnd int
moduleEnd
`)
		).rejects.toThrow();
	});

	test('throws when multi-character string key is used', async () => {
		await expect(
			createTestModule(`module m
int x
push x
mapBegin int
  map "AB" 10
mapEnd int
moduleEnd
`)
		).rejects.toThrow();
	});
});

describe('map: value type mismatch', () => {
	test('throws when float value used with int outputType', async () => {
		await expect(
			createTestModule(`module m
int x
push x
mapBegin int
  map 1 1.5
mapEnd int
moduleEnd
`)
		).rejects.toThrow();
	});

	test('throws when map value is an unresolved identifier', async () => {
		await expect(
			createTestModule(`module m
int x
push x
mapBegin int
  map 1 MISSING_CONST
mapEnd int
moduleEnd
`)
		).rejects.toThrow('Undeclared identifier');
	});
});

describe('map: default type mismatch', () => {
	test('throws when float default used with int outputType', async () => {
		await expect(
			createTestModule(`module m
int x
push x
mapBegin int
  default 1.5
mapEnd int
moduleEnd
`)
		).rejects.toThrow();
	});

	test('throws when default value is an unresolved identifier', async () => {
		await expect(
			createTestModule(`module m
int x
push x
mapBegin int
  default MISSING_CONST
mapEnd int
moduleEnd
`)
		).rejects.toThrow('Undeclared identifier');
	});
});

describe('map: instruction invalid outside map block', () => {
	test('throws when map used outside mapBegin/mapEnd', async () => {
		await expect(
			createTestModule(`module m
int x
push x
map 1 10
moduleEnd
`)
		).rejects.toThrow();
	});

	test('throws when one-argument map used outside mapBegin/mapEnd', async () => {
		await expect(
			createTestModule(`module m
int x
push x
map 10
moduleEnd
`)
		).rejects.toThrow();
	});

	test('throws when default used outside mapBegin/mapEnd', async () => {
		await expect(
			createTestModule(`module m
int x
default 10
moduleEnd
`)
		).rejects.toThrow();
	});
});

describe('map: invalid instruction inside map block', () => {
	test('throws when add is used inside map block', async () => {
		await expect(
			createTestModule(`module m
int x
push x
mapBegin int
  add
mapEnd int
moduleEnd
`)
		).rejects.toThrow();
	});
});
