export default function getMemoryFlags(baseType: 'int' | 'float' | 'float64', pointerDepth: number) {
	const isPointer = pointerDepth > 0;
	const isPointingToInteger = isPointer && baseType === 'int';
	const isPointingToPointer = pointerDepth === 2;
	const isInteger = baseType === 'int' || isPointer;
	const isFloat64 = baseType === 'float64' && !isPointer;

	return {
		isPointer,
		isPointingToInteger,
		isPointingToPointer,
		isInteger,
		...(isFloat64 ? { isFloat64 } : {}),
		isUnsigned: false,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getMemoryFlags', () => {
		describe('for int base type', () => {
			it('returns correct flags for non-pointer int', () => {
				const flags = getMemoryFlags('int', 0);
				expect(flags).toEqual({
					isPointer: false,
					isPointingToInteger: false,
					isPointingToPointer: false,
					isInteger: true,
					isUnsigned: false,
				});
			});

			it('returns correct flags for single-level int pointer', () => {
				const flags = getMemoryFlags('int', 1);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: true,
					isPointingToPointer: false,
					isInteger: true,
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level int pointer', () => {
				const flags = getMemoryFlags('int', 2);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: true,
					isPointingToPointer: true,
					isInteger: true,
					isUnsigned: false,
				});
			});
		});

		describe('for float64 base type', () => {
			it('returns correct flags for non-pointer float64', () => {
				const flags = getMemoryFlags('float64', 0);
				expect(flags).toEqual({
					isPointer: false,
					isPointingToInteger: false,
					isPointingToPointer: false,
					isInteger: false,
					isFloat64: true,
					isUnsigned: false,
				});
			});

			it('returns correct flags for single-level float64 pointer', () => {
				const flags = getMemoryFlags('float64', 1);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: false,
					isPointingToPointer: false,
					isInteger: true,
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level float64 pointer', () => {
				const flags = getMemoryFlags('float64', 2);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: false,
					isPointingToPointer: true,
					isInteger: true,
					isUnsigned: false,
				});
			});
		});

		describe('for float base type', () => {
			it('returns correct flags for non-pointer float', () => {
				const flags = getMemoryFlags('float', 0);
				expect(flags).toEqual({
					isPointer: false,
					isPointingToInteger: false,
					isPointingToPointer: false,
					isInteger: false,
					isUnsigned: false,
				});
			});

			it('returns correct flags for single-level float pointer', () => {
				const flags = getMemoryFlags('float', 1);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: false,
					isPointingToPointer: false,
					isInteger: true,
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level float pointer', () => {
				const flags = getMemoryFlags('float', 2);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: false,
					isPointingToPointer: true,
					isInteger: true,
					isUnsigned: false,
				});
			});
		});
	});
}
