export default function getMemoryFlags(baseType: 'int' | 'int8' | 'int16' | 'float' | 'float64', pointerDepth: number) {
	const isPointer = pointerDepth > 0;
	const isPointingToPointer = pointerDepth === 2;
	const isInteger = baseType === 'int' || baseType === 'int8' || baseType === 'int16' || isPointer;
	const isFloat64 = baseType === 'float64' && !isPointer;
	let pointeeBaseType: 'int' | 'int8' | 'int16' | 'float' | 'float64' | undefined;
	if (isPointer) {
		pointeeBaseType = baseType;
	}

	return {
		isPointingToPointer,
		isInteger,
		...(isFloat64 ? { isFloat64 } : {}),
		...(pointeeBaseType !== undefined ? { pointeeBaseType } : {}),
		isUnsigned: false,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getMemoryFlags', () => {
		describe('for int8 base type', () => {
			it('returns correct flags for single-level int8 pointer', () => {
				const flags = getMemoryFlags('int8', 1);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: true,
					pointeeBaseType: 'int8',
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level int8 pointer', () => {
				const flags = getMemoryFlags('int8', 2);
				expect(flags).toEqual({
					isPointingToPointer: true,
					isInteger: true,
					pointeeBaseType: 'int8',
					isUnsigned: false,
				});
			});
		});

		describe('for int16 base type', () => {
			it('returns correct flags for single-level int16 pointer', () => {
				const flags = getMemoryFlags('int16', 1);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: true,
					pointeeBaseType: 'int16',
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level int16 pointer', () => {
				const flags = getMemoryFlags('int16', 2);
				expect(flags).toEqual({
					isPointingToPointer: true,
					isInteger: true,
					pointeeBaseType: 'int16',
					isUnsigned: false,
				});
			});
		});

		describe('for int base type', () => {
			it('returns correct flags for non-pointer int', () => {
				const flags = getMemoryFlags('int', 0);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: true,
					isUnsigned: false,
				});
			});

			it('returns correct flags for single-level int pointer', () => {
				const flags = getMemoryFlags('int', 1);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: true,
					pointeeBaseType: 'int',
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level int pointer', () => {
				const flags = getMemoryFlags('int', 2);
				expect(flags).toEqual({
					isPointingToPointer: true,
					isInteger: true,
					pointeeBaseType: 'int',
					isUnsigned: false,
				});
			});
		});

		describe('for float64 base type', () => {
			it('returns correct flags for non-pointer float64', () => {
				const flags = getMemoryFlags('float64', 0);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: false,
					isFloat64: true,
					isUnsigned: false,
				});
			});

			it('returns correct flags for single-level float64 pointer', () => {
				const flags = getMemoryFlags('float64', 1);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: true,
					pointeeBaseType: 'float64',
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level float64 pointer', () => {
				const flags = getMemoryFlags('float64', 2);
				expect(flags).toEqual({
					isPointingToPointer: true,
					isInteger: true,
					pointeeBaseType: 'float64',
					isUnsigned: false,
				});
			});
		});

		describe('for float base type', () => {
			it('returns correct flags for non-pointer float', () => {
				const flags = getMemoryFlags('float', 0);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: false,
					isUnsigned: false,
				});
			});

			it('returns correct flags for single-level float pointer', () => {
				const flags = getMemoryFlags('float', 1);
				expect(flags).toEqual({
					isPointingToPointer: false,
					isInteger: true,
					pointeeBaseType: 'float',
					isUnsigned: false,
				});
			});

			it('returns correct flags for double-level float pointer', () => {
				const flags = getMemoryFlags('float', 2);
				expect(flags).toEqual({
					isPointingToPointer: true,
					isInteger: true,
					pointeeBaseType: 'float',
					isUnsigned: false,
				});
			});
		});
	});
}
