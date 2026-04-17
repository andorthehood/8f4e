import { describe, expect, it } from 'vitest';

import isArrayDeclarationInstruction from './isArrayDeclarationInstruction';

describe('isArrayDeclarationInstruction', () => {
	it('matches supported array declaration instructions', () => {
		expect(isArrayDeclarationInstruction('int[]')).toBe(true);
		expect(isArrayDeclarationInstruction('int8[]')).toBe(true);
		expect(isArrayDeclarationInstruction('int8u[]')).toBe(true);
		expect(isArrayDeclarationInstruction('int16[]')).toBe(true);
		expect(isArrayDeclarationInstruction('int16u[]')).toBe(true);
		expect(isArrayDeclarationInstruction('int32[]')).toBe(true);
		expect(isArrayDeclarationInstruction('int*[]')).toBe(true);
		expect(isArrayDeclarationInstruction('int**[]')).toBe(true);
		expect(isArrayDeclarationInstruction('float[]')).toBe(true);
		expect(isArrayDeclarationInstruction('float*[]')).toBe(true);
		expect(isArrayDeclarationInstruction('float**[]')).toBe(true);
		expect(isArrayDeclarationInstruction('float64[]')).toBe(true);
		expect(isArrayDeclarationInstruction('float64*[]')).toBe(true);
		expect(isArrayDeclarationInstruction('float64**[]')).toBe(true);
	});

	it('rejects unsupported declaration instructions', () => {
		expect(isArrayDeclarationInstruction('int16*[]')).toBe(false);
		expect(isArrayDeclarationInstruction('bool[]')).toBe(false);
		expect(isArrayDeclarationInstruction('int')).toBe(false);
	});
});
