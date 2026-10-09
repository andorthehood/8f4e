import { describe, expect, test } from 'vitest';

import { getExportedFunction, instantiateFixtureProgramSource } from './testUtils';

type NumericType = 'int' | 'float' | 'float64';
const numericTypes: NumericType[] = ['int', 'float', 'float64'];

function literal(value: number, type: NumericType): string {
	if (type === 'int') return String(value);
	const text = Object.is(value, -0) ? '-0.0' : Number.isInteger(value) ? `${value}.0` : String(value);
	return type === 'float64' ? `${text}f64` : text;
}

function lookupSource(
	name: string,
	inputType: NumericType,
	outputType: NumericType,
	rows: Array<[number, number]>,
	defaultValue?: number
): string {
	return [
		`function ${name}`,
		'#export',
		`param ${inputType} input`,
		'push input',
		`mapBegin ${inputType}`,
		...rows.map(([key, value]) => `map ${literal(key, inputType)} ${literal(value, outputType)}`),
		...(defaultValue === undefined ? [] : [`default ${literal(defaultValue, outputType)}`]),
		`mapEnd ${outputType}`,
		`functionEnd ${outputType}`,
	].join('\n');
}

describe('compiled map runtime behavior', () => {
	test.each(numericTypes.flatMap(input => numericTypes.map(output => [input, output] as const)))(
		'preserves matches and defaults for %s input and %s output',
		async (inputType, outputType) => {
			const first = outputType === 'int' ? 10 : 10.5;
			const second = outputType === 'int' ? 20 : 20.5;
			const fallback = outputType === 'int' ? -7 : -7.5;
			const fixture = await instantiateFixtureProgramSource(
				[
					'8f4e/v1',
					lookupSource('emptyImplicit', inputType, outputType, []),
					lookupSource('emptyExplicit', inputType, outputType, [], fallback),
					lookupSource('oneImplicit', inputType, outputType, [[1, first]]),
					lookupSource('oneExplicit', inputType, outputType, [[1, first]], fallback),
					lookupSource(
						'duplicates',
						inputType,
						outputType,
						[
							[1, first],
							[2, second],
							[1, second],
						],
						fallback
					),
				].join('\n\n')
			);
			expect(WebAssembly.validate(fixture.compileResult.codeBuffer)).toBe(true);
			const lookup = (name: string) => getExportedFunction(fixture.instance.exports, name);
			expect(lookup('emptyImplicit')(1)).toBe(0);
			expect(lookup('emptyExplicit')(1)).toBe(fallback);
			expect(lookup('oneImplicit')(1)).toBe(first);
			expect(lookup('oneImplicit')(3)).toBe(0);
			expect(lookup('oneExplicit')(1)).toBe(first);
			expect(lookup('oneExplicit')(3)).toBe(fallback);
			expect(lookup('duplicates')(1)).toBe(first);
			expect(lookup('duplicates')(2)).toBe(second);
			expect(lookup('duplicates')(3)).toBe(fallback);
			if (inputType !== 'int') {
				for (const input of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
					expect(lookup('emptyImplicit')(input)).toBe(0);
					expect(lookup('emptyExplicit')(input)).toBe(fallback);
					expect(lookup('oneImplicit')(input)).toBe(0);
					expect(lookup('duplicates')(input)).toBe(fallback);
				}
			}
		}
	);

	test.each(['float', 'float64'] as const)('compares keys at %s precision', async inputType => {
		const fixture = await instantiateFixtureProgramSource(
			`8f4e/v1\n${lookupSource(
				'lookup',
				inputType,
				'int',
				[
					[16777216, 10],
					[16777217, 20],
				],
				-7
			)}`
		);
		const lookup = getExportedFunction(fixture.instance.exports, 'lookup');
		expect(lookup(16777216)).toBe(10);
		// Distinct source keys collapse to the same f32 value, so the earlier row wins.
		expect(lookup(16777217)).toBe(inputType === 'float' ? 10 : 20);
		expect(lookup(16777218)).toBe(-7);
	});

	test.each(
		(['float', 'float64'] as const).flatMap(input =>
			(['float', 'float64'] as const).map(output => [input, output] as const)
		)
	)('preserves signed-zero matching and results for %s input and %s output', async (inputType, outputType) => {
		const fixture = await instantiateFixtureProgramSource(
			[
				'8f4e/v1',
				lookupSource(
					'zeroFirst',
					inputType,
					outputType,
					[
						[0, -0],
						[-0, 5],
					],
					7
				),
				lookupSource(
					'negativeZeroFirst',
					inputType,
					outputType,
					[
						[-0, 5],
						[0, -0],
					],
					7
				),
				lookupSource('negativeDefault', inputType, outputType, [[1, 5]], -0),
				lookupSource('emptyNegativeDefault', inputType, outputType, [], -0),
			].join('\n\n')
		);
		for (const input of [0, -0]) {
			expect(getExportedFunction(fixture.instance.exports, 'zeroFirst')(input)).toBe(-0);
			expect(getExportedFunction(fixture.instance.exports, 'negativeZeroFirst')(input)).toBe(5);
		}
		for (const input of [0, Number.NaN]) {
			expect(getExportedFunction(fixture.instance.exports, 'negativeDefault')(input)).toBe(-0);
			expect(getExportedFunction(fixture.instance.exports, 'emptyNegativeDefault')(input)).toBe(-0);
		}
	});
});
