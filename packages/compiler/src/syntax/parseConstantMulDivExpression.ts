export type CompileTimeMulDivExpression = {
	lhs: string;
	operator: '*' | '/';
	rhs: string;
};

/**
 * Finds the index of the single `*` or `/` operator that appears outside of parentheses.
 * Returns -1 if there is no such operator, or -2 if there is more than one.
 */
function findOperatorOutsideParens(value: string): number {
	let depth = 0;
	let operatorIndex = -1;

	for (let i = 0; i < value.length; i++) {
		const ch = value[i];
		if (ch === '(') {
			depth++;
		} else if (ch === ')') {
			depth--;
		} else if ((ch === '*' || ch === '/') && depth === 0) {
			if (operatorIndex !== -1) {
				return -2; // More than one operator outside parens
			}
			operatorIndex = i;
		}
	}

	return operatorIndex;
}

/**
 * Parses a compile-time `*` or `/` expression with exactly one operator outside parentheses.
 * Each side can be any compile-time-resolvable operand: a numeric literal,
 * a constant identifier, or a metadata query such as `sizeof(name)` or `count(name)`.
 *
 * Returns the parsed expression or `null` if the value is not a single-operator expression.
 */
export default function parseConstantMulDivExpression(value: string): CompileTimeMulDivExpression | null {
	const operatorIndex = findOperatorOutsideParens(value);

	// Require exactly one operator outside parens
	if (operatorIndex < 0) {
		return null;
	}

	// Operator must not be at start or end
	if (operatorIndex === 0 || operatorIndex === value.length - 1) {
		return null;
	}

	const operator = value[operatorIndex] as CompileTimeMulDivExpression['operator'];
	const lhs = value.slice(0, operatorIndex);
	const rhs = value.slice(operatorIndex + 1);

	return { lhs, operator, rhs };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseConstantMulDivExpression', () => {
		it('parses constant * literal', () => {
			expect(parseConstantMulDivExpression('SIZE*2')).toEqual({
				lhs: 'SIZE',
				operator: '*',
				rhs: '2',
			});
		});

		it('parses constant / literal', () => {
			expect(parseConstantMulDivExpression('SIZE/2')).toEqual({
				lhs: 'SIZE',
				operator: '/',
				rhs: '2',
			});
		});

		it('parses literal * constant', () => {
			expect(parseConstantMulDivExpression('2*SIZE')).toEqual({
				lhs: '2',
				operator: '*',
				rhs: 'SIZE',
			});
		});

		it('parses metadata query * literal', () => {
			expect(parseConstantMulDivExpression('sizeof(name)*2')).toEqual({
				lhs: 'sizeof(name)',
				operator: '*',
				rhs: '2',
			});
		});

		it('parses literal * metadata query', () => {
			expect(parseConstantMulDivExpression('123*sizeof(name)')).toEqual({
				lhs: '123',
				operator: '*',
				rhs: 'sizeof(name)',
			});
		});

		it('parses metadata query with pointee form', () => {
			expect(parseConstantMulDivExpression('sizeof(*ptr)*4')).toEqual({
				lhs: 'sizeof(*ptr)',
				operator: '*',
				rhs: '4',
			});
		});

		it('parses constant * metadata query', () => {
			expect(parseConstantMulDivExpression('SIZE*sizeof(name)')).toEqual({
				lhs: 'SIZE',
				operator: '*',
				rhs: 'sizeof(name)',
			});
		});

		it('rejects multiple operators outside parens', () => {
			expect(parseConstantMulDivExpression('SIZE/2/2')).toBeNull();
			expect(parseConstantMulDivExpression('SIZE*2/2')).toBeNull();
		});

		it('rejects operators at start or end', () => {
			expect(parseConstantMulDivExpression('*SIZE')).toBeNull();
			expect(parseConstantMulDivExpression('SIZE*')).toBeNull();
		});

		it('returns null for plain identifiers or literals', () => {
			expect(parseConstantMulDivExpression('SIZE')).toBeNull();
			expect(parseConstantMulDivExpression('42')).toBeNull();
			expect(parseConstantMulDivExpression('sizeof(name)')).toBeNull();
		});

		it('counts operators inside parentheses as non-operators', () => {
			// sizeof(*name) has a * inside parens — should not count as operator
			expect(parseConstantMulDivExpression('sizeof(*name)')).toBeNull();
		});
	});
}
