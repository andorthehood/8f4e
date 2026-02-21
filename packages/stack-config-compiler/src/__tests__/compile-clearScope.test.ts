import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - clearScope command', () => {
	it('should reset scope to root', () => {
		const source = `
scope "instrument.piano.name"
push "Grand Piano"
set

clearScope

scope "instrument.harp.name"
push "Celtic Harp"
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			instrument: {
				piano: {
					name: 'Grand Piano',
				},
				harp: {
					name: 'Celtic Harp',
				},
			},
		});
	});

	it('should clear scoped constants', () => {
		const source = `
const GLOBAL "global value"

scope "first"
const LOCAL "first local"
push LOCAL
set

clearScope

scope "second"
const LOCAL "second local"
push LOCAL
set

clearScope

scope "third"
push GLOBAL
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			first: 'first local',
			second: 'second local',
			third: 'global value',
		});
	});

	it('should behave like rescope with empty path', () => {
		const source1 = `
scope "a.b.c"
push 1
set

clearScope

scope "x.y"
push 2
set
`;

		const source2 = `
scope "a.b.c"
push 1
set

rescope ""

scope "x.y"
push 2
set
`;

		const result1 = compileConfig([source1]);
		const result2 = compileConfig([source2]);

		expect(result1.errors).toEqual([]);
		expect(result2.errors).toEqual([]);
		expect(result1.config).toEqual(result2.config);
		expect(result1.config).toEqual({
			a: { b: { c: 1 } },
			x: { y: 2 },
		});
	});

	it('should work multiple times in a program', () => {
		const source = `
scope "a"
push 1
set

clearScope

scope "b"
push 2
set

clearScope

scope "c"
push 3
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			a: 1,
			b: 2,
			c: 3,
		});
	});

	it('should preserve root constants after clearScope', () => {
		const source = `
const ROOT_VAL 100

scope "a.b"
push ROOT_VAL
set

clearScope

scope "c.d"
push ROOT_VAL
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			a: { b: 100 },
			c: { d: 100 },
		});
	});
});
