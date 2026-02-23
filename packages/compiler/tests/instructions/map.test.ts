import { describe, test, expect } from 'vitest';

import { moduleTester, createTestModule } from './testUtils';

// ─── Happy paths ────────────────────────────────────────────────────────────

moduleTester(
	'map: int→int basic mapping',
	`module mapIntInt

int input
int output

push &output
push input
mapBegin int
  map 1 100
  map 2 200
  map 3 300
mapEnd int
store

moduleEnd
`,
	[
		[{ input: 1 }, { output: 100 }],
		[{ input: 2 }, { output: 200 }],
		[{ input: 3 }, { output: 300 }],
		[{ input: 99 }, { output: 0 }],
	]
);

moduleTester(
	'map: int→int with single-character literals as ASCII',
	`module mapCharLiteral

int input
int output

push &output
push input
mapBegin int
  map "A" "B"
mapEnd int
store

moduleEnd
`,
	[
		[{ input: 65 }, { output: 66 }],
		[{ input: 66 }, { output: 0 }],
	]
);

moduleTester(
	'map: int→int with explicit default',
	`module mapIntIntDefault

int input
int output

push &output
push input
mapBegin int
  map 1 10
  default 999
mapEnd int
store

moduleEnd
`,
	[
		[{ input: 1 }, { output: 10 }],
		[{ input: 0 }, { output: 999 }],
		[{ input: 42 }, { output: 999 }],
	]
);

moduleTester(
	'map: int→float mapping',
	`module mapIntFloat

int input
float output

push &output
push input
mapBegin int
  map 0 0.5
  map 1 1.5
mapEnd float
store

moduleEnd
`,
	[
		[{ input: 0 }, { output: 0.5 }],
		[{ input: 1 }, { output: 1.5 }],
		[{ input: 2 }, { output: 0.0 }],
	]
);

moduleTester(
	'map: float→float mapping',
	`module mapFloatFloat

float input
float output

push &output
push input
mapBegin float
  map 0.5 10.0
  map 1.5 20.0
mapEnd float
store

moduleEnd
`,
	[
		[{ input: 0.5 }, { output: 10.0 }],
		[{ input: 1.5 }, { output: 20.0 }],
		[{ input: 0.0 }, { output: 0.0 }],
	]
);

moduleTester(
	'map: implicit default zero for int output',
	`module mapImplicitDefault

int input
int output

push &output
push input
mapBegin int
  map 7 42
mapEnd int
store

moduleEnd
`,
	[
		[{ input: 7 }, { output: 42 }],
		[{ input: 0 }, { output: 0 }],
	]
);

moduleTester(
	'map: first-match-wins with duplicate keys',
	`module mapFirstMatch

int input
int output

push &output
push input
mapBegin int
  map 1 10
  map 1 20
mapEnd int
store

moduleEnd
`,
	[[{ input: 1 }, { output: 10 }]]
);

moduleTester(
	'map: zero-row map returns default',
	`module mapZeroRows

int input
int output

push &output
push input
mapBegin int
mapEnd int
store

moduleEnd
`,
	[[{ input: 5 }, { output: 0 }]]
);

moduleTester(
	'map: zero-row map with explicit default',
	`module mapZeroRowsDefault

int input
int output

push &output
push input
mapBegin int
  default 42
mapEnd int
store

moduleEnd
`,
	[[{ input: 5 }, { output: 42 }]]
);

// ─── Error paths ─────────────────────────────────────────────────────────────

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
