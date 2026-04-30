import { describe, expect, it } from 'vitest';

import { createTestModule } from './testUtils';

const sourceCode = `module clamp

int intLow
int intHigh
int intLowOut
int intHighOut

float floatHigh
float floatHighOut

float64 float64Low
float64 float64LowOut

push &intLowOut
push intLow
push 0
push 10
clamp
store

push &intHighOut
push intHigh
push 0
push 10
clamp
store

push &floatHighOut
push floatHigh
push 0.0
push 0.5
clamp
store

push &float64LowOut
push float64Low
push -1.0
castToFloat64
push 1.0
castToFloat64
clamp
store

moduleEnd
`;

describe('clamp instruction', () => {
	it('limits int, float and float64 values to the inclusive range', async () => {
		const testModule = await createTestModule(sourceCode);

		testModule.memory.set('intLow', -5);
		testModule.memory.set('intHigh', 15);
		testModule.memory.set('floatHigh', 0.75);
		testModule.memory.set('float64Low', -2.0);

		testModule.test();

		expect(testModule.memory.get('intLowOut')).toBe(0);
		expect(testModule.memory.get('intHighOut')).toBe(10);
		expect(testModule.memory.get('floatHighOut')).toBeCloseTo(0.5);
		expect(testModule.memory.get('float64LowOut')).toBeCloseTo(-1.0);
	});
});
