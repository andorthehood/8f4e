import { describe, expect, it } from 'vitest';
import { divide, exp, fixed, log, multiply, PI, SCALE, sinCos, toDecimal } from './fixedPoint.ts';

const asNumber = (value: bigint) => Number(toDecimal(value));

describe('fixed-point table math', () => {
	it('parses decimal inputs and keeps multiply/divide results in the fixed-point scale', () => {
		expect(fixed('-0.525')).toBe((-525n * SCALE) / 1000n);
		expect(toDecimal(multiply(fixed('-0.525'), fixed('2')))).toBe('-1.050000000000000000');
		expect(toDecimal(divide(SCALE, fixed('8')))).toBe('0.125000000000000000');
	});

	it('matches known constants at all eighteen emitted decimal places', () => {
		expect(toDecimal(PI)).toBe('3.141592653589793238');
		expect(toDecimal(log(2n * SCALE))).toBe('0.693147180559945309');
		expect(toDecimal(exp(SCALE))).toBe('2.718281828459045235');
		expect(toDecimal(sinCos(SCALE).sin)).toBe('0.841470984807896507');
		expect(toDecimal(sinCos(SCALE).cos)).toBe('0.540302305868139717');
	});

	it.each(['-7', '-3', '-1', '0', '1', '3', '7'])('matches reference trigonometry across quadrants at %s', value => {
		const result = sinCos(fixed(value));
		expect(asNumber(result.sin)).toBeCloseTo(Math.sin(Number(value)), 14);
		expect(asNumber(result.cos)).toBeCloseTo(Math.cos(Number(value)), 14);
	});

	it.each(['-32', '-1', '0', '1', '8'])('round-trips log(exp(%s)) with ample precision for table output', value => {
		const expected = fixed(value);
		const difference = log(exp(expected)) - expected;
		expect(difference < 0n ? -difference : difference).toBeLessThan(SCALE / 10n ** 40n);
	});

	it('handles the squared-magnitude floor used by minBLEP', () => {
		const value = fixed('0.000000000000000000000000000001');
		const difference = exp(log(value)) - value;
		expect(difference < 0n ? -difference : difference).toBeLessThan(10000n);
	});

	it('rounds only at decimal emission, carrying across integers and avoiding negative zero', () => {
		expect(toDecimal(fixed('0.9999999999999999995'))).toBe('1.000000000000000000');
		expect(toDecimal(fixed('-0.9999999999999999995'))).toBe('-1.000000000000000000');
		expect(toDecimal(fixed('-0.0000000000000000001'))).toBe('0.000000000000000000');
	});
});
