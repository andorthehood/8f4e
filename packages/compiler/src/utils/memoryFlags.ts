export function getMemoryFlags(baseType: 'int' | 'float', pointerDepth: number) {
	const isPointer = pointerDepth > 0;
	const isPointingToInteger = isPointer && baseType === 'int';
	const isPointingToPointer = pointerDepth === 2;
	const isInteger = baseType === 'int' || isPointer;

	return {
		isPointer,
		isPointingToInteger,
		isPointingToPointer,
		isInteger,
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
				});
			});

			it('returns correct flags for single-level int pointer', () => {
				const flags = getMemoryFlags('int', 1);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: true,
					isPointingToPointer: false,
					isInteger: true,
				});
			});

			it('returns correct flags for double-level int pointer', () => {
				const flags = getMemoryFlags('int', 2);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: true,
					isPointingToPointer: true,
					isInteger: true,
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
				});
			});

			it('returns correct flags for single-level float pointer', () => {
				const flags = getMemoryFlags('float', 1);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: false,
					isPointingToPointer: false,
					isInteger: true,
				});
			});

			it('returns correct flags for double-level float pointer', () => {
				const flags = getMemoryFlags('float', 2);
				expect(flags).toEqual({
					isPointer: true,
					isPointingToInteger: false,
					isPointingToPointer: true,
					isInteger: true,
				});
			});
		});
	});
}
