import { describe, expect, it } from 'vitest';

import { createTestModule } from './testUtils';

const sourceCode = `module minMax

int intLeft
int intRight
int intMin
int intMax

float floatLeft
float floatRight
float floatMin
float floatMax

float64 float64Left
float64 float64Right
float64 float64Min
float64 float64Max

push &intMin
push intLeft
push intRight
min
store

push &intMax
push intLeft
push intRight
max
store

push &floatMin
push floatLeft
push floatRight
min
store

push &floatMax
push floatLeft
push floatRight
max
store

push &float64Min
push float64Left
push float64Right
min
store

push &float64Max
push float64Left
push float64Right
max
store

moduleEnd
`;

describe('min and max instructions', () => {
	it('selects the smaller and larger int, float and float64 operands', async () => {
		const testModule = await createTestModule(sourceCode);

		testModule.memory.set('intLeft', 10);
		testModule.memory.set('intRight', -3);
		testModule.memory.set('floatLeft', 0.5);
		testModule.memory.set('floatRight', 0.7);
		testModule.memory.set('float64Left', 1.25);
		testModule.memory.set('float64Right', 1.125);

		testModule.test();

		expect(testModule.memory.get('intMin')).toBe(-3);
		expect(testModule.memory.get('intMax')).toBe(10);
		expect(testModule.memory.get('floatMin')).toBeCloseTo(0.5);
		expect(testModule.memory.get('floatMax')).toBeCloseTo(0.7);
		expect(testModule.memory.get('float64Min')).toBeCloseTo(1.125);
		expect(testModule.memory.get('float64Max')).toBeCloseTo(1.25);
	});
});
