import { describe, expect, test } from 'vitest';

import { getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

describe.each([
	{ valueType: 'float', suffix: '', toOperandPrecision: Math.fround },
	{ valueType: 'float64', suffix: 'f64', toOperandPrecision: (value: number) => value },
])('ensureNonZero with $valueType operands', ({ valueType, suffix, toOperandPrecision }) => {
	test.each([0.01, 1.234, -0.01, -1.234])('preserves the precision of fallback %s', async fallback => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

function fallback
#export
param ${valueType} input
push input
ensureNonZero ${fallback}${suffix}
functionEnd ${valueType}
`);
		const run = getExportedFunction(fixture.instance.exports, 'fallback');

		expect(run(0)).toBe(toOperandPrecision(fallback));
		expect(run(-0)).toBe(toOperandPrecision(fallback));

		for (const input of [0.01, 1.234, -0.01, -1.234]) {
			expect(run(input)).toBe(toOperandPrecision(input));
		}
	});

	test('defaults to one when the fallback is omitted', async () => {
		const fixture = await instantiateFixtureProgramSource(`
8f4e/v1

function fallback
#export
param ${valueType} input
push input
ensureNonZero
functionEnd ${valueType}
`);
		const run = getExportedFunction(fixture.instance.exports, 'fallback');

		expect(run(0)).toBe(1);
		expect(run(-0)).toBe(1);
		expect(run(1.234)).toBe(toOperandPrecision(1.234));
		expect(run(-1.234)).toBe(toOperandPrecision(-1.234));
	});
});
