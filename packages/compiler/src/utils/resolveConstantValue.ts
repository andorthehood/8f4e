import { ErrorCode, getError } from '../errors';
import { parseArgument, ArgumentType, type ArgumentLiteral } from '../syntax/parseArgument';
import parseConstantMulDivExpression, {
	type ConstantMulDivExpression,
} from '../syntax/parseConstantMulDivExpression';

import type { AST, CompilationContext, Const, Consts } from '../types';

type MulDivOperator = ConstantMulDivExpression['operator'];

function resolveExpressionRhsLiteral(
	expression: ConstantMulDivExpression,
	line: AST[number],
	context: CompilationContext
): ArgumentLiteral {
	const rhsArgument = parseArgument(expression.rhs);

	if (rhsArgument.type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return rhsArgument;
}

function evaluateConstantExpression(baseConst: Const, rhsLiteral: ArgumentLiteral, operator: MulDivOperator): Const {
	const value = operator === '*' ? baseConst.value * rhsLiteral.value : baseConst.value / rhsLiteral.value;
	const isFloat64 = !!baseConst.isFloat64 || !!rhsLiteral.isFloat64;
	const isInteger = !isFloat64 && baseConst.isInteger && rhsLiteral.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}

export function isConstantValueOrExpression(consts: Consts, value: string): boolean {
	if (typeof consts[value] !== 'undefined') {
		return true;
	}

	const expression = parseConstantMulDivExpression(value);

	return expression !== null && typeof consts[expression.baseIdentifier] !== 'undefined';
}

export function tryResolveConstantValueOrExpression(consts: Consts, value: string): Const | undefined {
	const directConst = consts[value];

	if (directConst !== undefined) {
		return directConst;
	}

	const expression = parseConstantMulDivExpression(value);

	if (!expression) {
		return undefined;
	}

	const baseConst = consts[expression.baseIdentifier];

	if (baseConst === undefined) {
		return undefined;
	}

	const rhsArgument = parseArgument(expression.rhs);

	if (rhsArgument.type !== ArgumentType.LITERAL) {
		return undefined;
	}

	if (expression.operator === '/' && rhsArgument.value === 0) {
		return undefined;
	}

	return evaluateConstantExpression(baseConst, rhsArgument, expression.operator);
}

export function resolveConstantValueOrExpressionOrThrow(
	value: string,
	line: AST[number],
	context: CompilationContext
): Const {
	const directConst = context.namespace.consts[value];

	if (directConst !== undefined) {
		return directConst;
	}

	const expression = parseConstantMulDivExpression(value);

	if (!expression) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	const baseConst = context.namespace.consts[expression.baseIdentifier];

	if (baseConst === undefined) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	const rhsLiteral = resolveExpressionRhsLiteral(expression, line, context);

	if (expression.operator === '/' && rhsLiteral.value === 0) {
		throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
	}

	return evaluateConstantExpression(baseConst, rhsLiteral, expression.operator);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('resolveConstantValue', () => {
		const mockLine = {
			lineNumber: 1,
			instruction: 'const',
			arguments: [{ type: ArgumentType.IDENTIFIER, value: 'A' }],
		} as unknown as AST[number];
		const mockContext = {
			namespace: {
				consts: {
					SIZE: { value: 16, isInteger: true },
					PI64: { value: 3.14159, isInteger: false, isFloat64: true },
				},
			},
		} as unknown as CompilationContext;

		it('resolves direct constants', () => {
			expect(resolveConstantValueOrExpressionOrThrow('SIZE', mockLine, mockContext)).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('resolves multiplication expression', () => {
			expect(resolveConstantValueOrExpressionOrThrow('SIZE*2', mockLine, mockContext)).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves division expression', () => {
			expect(resolveConstantValueOrExpressionOrThrow('SIZE/2', mockLine, mockContext)).toEqual({
				value: 8,
				isInteger: true,
			});
		});

		it('keeps float64 width for expression results', () => {
			expect(resolveConstantValueOrExpressionOrThrow('PI64*2', mockLine, mockContext)).toEqual({
				value: 6.28318,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('rejects expressions with multiple operators', () => {
			expect(tryResolveConstantValueOrExpression(mockContext.namespace.consts, 'SIZE/2/2')).toBeUndefined();
			expect(tryResolveConstantValueOrExpression(mockContext.namespace.consts, 'SIZE*2/2')).toBeUndefined();
		});
	});
}
