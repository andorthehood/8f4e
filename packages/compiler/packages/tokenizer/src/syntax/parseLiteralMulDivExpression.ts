import parseNumericLiteralToken, { isNumericLikeInvalidToken } from './parseNumericLiteralToken';
import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';

export type LiteralMulDivResult = {
	value: number;
	isInteger: boolean;
	isFloat64?: boolean;
};

/**
 * Tries to parse a literal-only `*` or `/` expression with exactly one operator
 * and numeric-literal operands on both sides.
 *
 * Returns the folded result, or `null` if the argument is not a literal mul/div expression.
 * Throws `SyntaxRulesError` when a literal-only numeric expression contains an invalid
 * numeric operand or divides by zero.
 */
export default function parseLiteralMulDivExpression(argument: string): LiteralMulDivResult | null {
	// Require exactly one * or / across the whole string
	const operators = argument.match(/[*/]/g);
	if (!operators || operators.length !== 1) {
		return null;
	}

	const opIndex = argument.indexOf(operators[0]);
	// Operator must not be at the start or end
	if (opIndex <= 0 || opIndex === argument.length - 1) {
		return null;
	}

	const operator = argument[opIndex] as '*' | '/';
	const lhsStr = argument.slice(0, opIndex);
	const rhsStr = argument.slice(opIndex + 1);

	let lhs: ReturnType<typeof parseNumericLiteralToken>;
	let rhs: ReturnType<typeof parseNumericLiteralToken>;

	try {
		lhs = parseNumericLiteralToken(lhsStr);
		rhs = parseNumericLiteralToken(rhsStr);
	} catch (error) {
		if (error instanceof SyntaxRulesError && error.code === SyntaxErrorCode.INVALID_NUMERIC_LITERAL) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_NUMERIC_LITERAL,
				`Invalid numeric literal or expression: ${argument}`
			);
		}
		throw error;
	}

	if (!lhs || !rhs) {
		if (isNumericLikeInvalidToken(lhsStr) || isNumericLikeInvalidToken(rhsStr)) {
			throw new SyntaxRulesError(
				SyntaxErrorCode.INVALID_NUMERIC_LITERAL,
				`Invalid numeric literal or expression: ${argument}`
			);
		}
		return null;
	}

	if (operator === '/' && rhs.value === 0) {
		throw new SyntaxRulesError(SyntaxErrorCode.DIVISION_BY_ZERO, `Division by zero in literal expression: ${argument}`);
	}

	const value = operator === '*' ? lhs.value * rhs.value : lhs.value / rhs.value;
	const isFloat64 = lhs.isFloat64 || rhs.isFloat64;

	return {
		value,
		isInteger: !isFloat64 && lhs.isInteger && rhs.isInteger && Number.isInteger(value),
		...(isFloat64 && { isFloat64: true }),
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseLiteralMulDivExpression', () => {
		it('folds integer multiplication', () => {
			expect(parseLiteralMulDivExpression('16*2')).toEqual({ value: 32, isInteger: true });
			expect(parseLiteralMulDivExpression('3*4')).toEqual({ value: 12, isInteger: true });
		});

		it('folds float * integer: result is float-typed even when mathematically integer', () => {
			expect(parseLiteralMulDivExpression('3.5*4')).toEqual({ value: 14, isInteger: false });
		});

		it('folds float * float with float result', () => {
			expect(parseLiteralMulDivExpression('3.5*0.5')).toEqual({ value: 1.75, isInteger: false });
		});

		it('folds integer division', () => {
			expect(parseLiteralMulDivExpression('8/2')).toEqual({ value: 4, isInteger: true });
		});

		it('folds integer division with float result', () => {
			expect(parseLiteralMulDivExpression('1/2')).toEqual({ value: 0.5, isInteger: false });
		});

		it('folds hex operands', () => {
			expect(parseLiteralMulDivExpression('0x10/2')).toEqual({ value: 8, isInteger: true });
			expect(parseLiteralMulDivExpression('0x10*2')).toEqual({ value: 32, isInteger: true });
		});

		it('folds binary operands', () => {
			expect(parseLiteralMulDivExpression('0b101*2')).toEqual({ value: 10, isInteger: true });
			expect(parseLiteralMulDivExpression('0b1000/2')).toEqual({ value: 4, isInteger: true });
		});

		it('propagates isFloat64 from lhs operand', () => {
			expect(parseLiteralMulDivExpression('3f64*2')).toEqual({ value: 6, isInteger: false, isFloat64: true });
		});

		it('propagates isFloat64 from rhs operand', () => {
			expect(parseLiteralMulDivExpression('2*3f64')).toEqual({ value: 6, isInteger: false, isFloat64: true });
		});

		it('propagates isFloat64 when both operands are f64', () => {
			expect(parseLiteralMulDivExpression('3f64*2f64')).toEqual({ value: 6, isInteger: false, isFloat64: true });
		});

		it('throws for invalid numeric operands', () => {
			expect(() => parseLiteralMulDivExpression('1e309*2')).toThrow('Invalid numeric literal');
			expect(() => parseLiteralMulDivExpression('1e309f64*2')).toThrow('Invalid numeric literal');
			expect(() => parseLiteralMulDivExpression('2*1e309f64')).toThrow('Invalid numeric literal');
		});

		it('throws on division by zero', () => {
			expect(() => parseLiteralMulDivExpression('8/0')).toThrow('Division by zero');
			expect(() => parseLiteralMulDivExpression('1/0')).toThrow('Division by zero');
		});

		it('returns null for chained operators', () => {
			expect(parseLiteralMulDivExpression('2*3*4')).toBeNull();
			expect(parseLiteralMulDivExpression('2*3/4')).toBeNull();
		});

		it('returns null for identifier operands', () => {
			expect(parseLiteralMulDivExpression('SIZE*2')).toBeNull();
			expect(parseLiteralMulDivExpression('SIZE/2')).toBeNull();
		});

		it('returns null for plain numeric literals', () => {
			expect(parseLiteralMulDivExpression('16')).toBeNull();
			expect(parseLiteralMulDivExpression('3.14')).toBeNull();
			expect(parseLiteralMulDivExpression('0x10')).toBeNull();
		});

		it('folds negative numerator with positive denominator', () => {
			expect(parseLiteralMulDivExpression('-1/2')).toEqual({ value: -0.5, isInteger: false });
		});

		it('folds positive numerator with negative denominator', () => {
			expect(parseLiteralMulDivExpression('1/-2')).toEqual({ value: -0.5, isInteger: false });
		});
	});
}
