import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - fraction literals', () => {
	it('should compile fraction literals in push commands', () => {
		const source = `
scope "config.ratio"
push 1/16
set

rescope "config.half"
push 8/2
set

rescope "config.negative"
push -1/2
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			config: {
				ratio: 0.0625,
				half: 4,
				negative: -0.5,
			},
		});
	});

	it('should compile fraction literals in const commands', () => {
		const source = `
const RATIO 1/16
const MAX 8/2
const NEG_HALF -1/2

scope "values.ratio"
push RATIO
set

rescope "values.max"
push MAX
set

rescope "values.negHalf"
push NEG_HALF
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			values: {
				ratio: 0.0625,
				max: 4,
				negHalf: -0.5,
			},
		});
	});

	it('should use fraction literals in concat operations', () => {
		const source = `
const PREFIX "value:"

scope "result"
push PREFIX
push 1/4
concat
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			result: 'value:0.25',
		});
	});

	it('should error on division by zero in push', () => {
		const source = `
scope "test"
push 8/0
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			line: 3,
			message: 'Division by zero in fraction: 8/0',
		});
	});

	it('should error on division by zero in const', () => {
		const source = `
const VALUE 10/0
scope "test"
push VALUE
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			line: 2,
			message: 'Division by zero in fraction: 10/0',
		});
	});

	it('should handle fractions in arrays', () => {
		const source = `
scope "ratios"
push 1/2
push 1/4
push 1/8
push 1/16
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			ratios: [0.5, 0.25, 0.125, 0.0625],
		});
	});

	it('should reject invalid numeric tokens that previously partially parsed', () => {
		const source = `
scope "test"
push 123abc
set
`;
		const result = compileConfig([source]);
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			line: 3,
			message: 'Invalid literal: 123abc',
		});
	});

	it('should handle complex fraction expressions in nested structures', () => {
		const source = `
const SCALE 1/2

scope "dimensions.width"
push SCALE
set

rescope "dimensions.height"
push 3/4
set

rescope "grid[0][0]"
push 1/16
set

rescope "grid[0][1]"
push 1/8
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			dimensions: {
				width: 0.5,
				height: 0.75,
			},
			grid: [[0.0625, 0.125]],
		});
	});

	it('should support both positive and negative fractions', () => {
		const source = `
scope "values.positive"
push 3/4
set

rescope "values.negNumerator"
push -3/4
set

rescope "values.negDenominator"
push 3/-4
set

rescope "values.bothNeg"
push -3/-4
set
`;
		const result = compileConfig([source]);
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			values: {
				positive: 0.75,
				negNumerator: -0.75,
				negDenominator: -0.75,
				bothNeg: 0.75,
			},
		});
	});
});
