import {
	getElementCount,
	getElementWordSize,
	getPointeeElementWordSize,
	getElementMaxValue,
	getPointeeElementMaxValue,
	getElementMinValue,
} from './memoryData';

import { ErrorCode, getError } from '../compilerError';
import { parseArgument, ArgumentType } from '../syntax/parseArgument';
import parseConstantMulDivExpression, {
	type CompileTimeMulDivExpression,
} from '../syntax/parseConstantMulDivExpression';
import hasElementCountPrefix from '../syntax/hasElementCountPrefix';
import hasElementWordSizePrefix from '../syntax/hasElementWordSizePrefix';
import hasPointeeElementWordSizePrefix from '../syntax/hasPointeeElementWordSizePrefix';
import hasElementMaxPrefix from '../syntax/hasElementMaxPrefix';
import hasPointeeElementMaxPrefix from '../syntax/hasPointeeElementMaxPrefix';
import hasElementMinPrefix from '../syntax/hasElementMinPrefix';
import extractElementCountBase from '../syntax/extractElementCountBase';
import extractElementWordSizeBase from '../syntax/extractElementWordSizeBase';
import extractPointeeElementWordSizeBase from '../syntax/extractPointeeElementWordSizeBase';
import extractElementMaxBase from '../syntax/extractElementMaxBase';
import extractPointeeElementMaxBase from '../syntax/extractPointeeElementMaxBase';
import extractElementMinBase from '../syntax/extractElementMinBase';

import type { AST, CompilationContext, Const, Consts, Namespace } from '../types';

type MulDivOperator = CompileTimeMulDivExpression['operator'];

/**
 * Tries to resolve a single compile-time operand to a `Const` value.
 * Handles numeric literals, constant identifiers, and memory metadata queries
 * (sizeof, count, max, min — including pointee forms).
 * Returns `undefined` if the operand cannot be resolved from the available context.
 */
function resolveCompileTimeOperand(operand: string, namespace: Namespace): Const | undefined {
	// Try numeric literal first
	const arg = parseArgument(operand);
	if (arg.type === ArgumentType.LITERAL) {
		return { value: arg.value, isInteger: arg.isInteger, ...(arg.isFloat64 ? { isFloat64: true } : {}) };
	}

	// Try direct constant lookup
	const directConst = namespace.consts[operand];
	if (directConst !== undefined) {
		return directConst;
	}

	const { memory } = namespace;

	// Try sizeof(*name) — pointee element word size
	if (hasPointeeElementWordSizePrefix(operand)) {
		const base = extractPointeeElementWordSizeBase(operand);
		if (Object.hasOwn(memory, base)) {
			return { value: getPointeeElementWordSize(memory, base), isInteger: true };
		}
		return undefined;
	}

	// Try sizeof(name) — element word size
	if (hasElementWordSizePrefix(operand)) {
		const base = extractElementWordSizeBase(operand);
		if (Object.hasOwn(memory, base)) {
			return { value: getElementWordSize(memory, base), isInteger: true };
		}
		return undefined;
	}

	// Try count(name) — element count
	if (hasElementCountPrefix(operand)) {
		const base = extractElementCountBase(operand);
		if (Object.hasOwn(memory, base)) {
			return { value: getElementCount(memory, base), isInteger: true };
		}
		return undefined;
	}

	// Try max(*name) — pointee element max value
	if (hasPointeeElementMaxPrefix(operand)) {
		const base = extractPointeeElementMaxBase(operand);
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getPointeeElementMaxValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// Try max(name) — element max value
	if (hasElementMaxPrefix(operand)) {
		const base = extractElementMaxBase(operand);
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getElementMaxValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// Try min(name) — element min value
	if (hasElementMinPrefix(operand)) {
		const base = extractElementMinBase(operand);
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getElementMinValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	return undefined;
}

function evaluateConstantExpression(lhsConst: Const, rhsConst: Const, operator: MulDivOperator): Const {
	const value = operator === '*' ? lhsConst.value * rhsConst.value : lhsConst.value / rhsConst.value;
	const isFloat64 = !!lhsConst.isFloat64 || !!rhsConst.isFloat64;
	const isInteger = !isFloat64 && lhsConst.isInteger && rhsConst.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}

/**
 * Returns true if the value is a direct constant or a compile-time expression
 * resolvable from constants and literals alone (no memory map access).
 * Used for routing decisions where only the consts map is available.
 */
export function isConstantValueOrExpression(consts: Consts, value: string): boolean {
	if (typeof consts[value] !== 'undefined') {
		return true;
	}

	const expression = parseConstantMulDivExpression(value);
	if (!expression) {
		return false;
	}

	// Check lhs: must be a literal or a known constant (no memory queries here)
	const lhsArg = parseArgument(expression.lhs);
	const lhsIsLiteralOrConst = lhsArg.type === ArgumentType.LITERAL || typeof consts[expression.lhs] !== 'undefined';

	if (!lhsIsLiteralOrConst) {
		return false;
	}

	// Check rhs: must be a literal or a known constant
	const rhsArg = parseArgument(expression.rhs);
	const rhsIsLiteralOrConst = rhsArg.type === ArgumentType.LITERAL || typeof consts[expression.rhs] !== 'undefined';

	return rhsIsLiteralOrConst;
}

/**
 * Returns true if the value is resolvable as a compile-time value using the full namespace,
 * including metadata queries (sizeof, count, max, min) on both operands.
 */
export function isCompileTimeValueOrExpression(namespace: Namespace, value: string): boolean {
	if (resolveCompileTimeOperand(value, namespace) !== undefined) {
		return true;
	}

	const expression = parseConstantMulDivExpression(value);
	if (!expression) {
		return false;
	}

	return (
		resolveCompileTimeOperand(expression.lhs, namespace) !== undefined &&
		resolveCompileTimeOperand(expression.rhs, namespace) !== undefined
	);
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

	// Resolve lhs: literal or constant only (no memory access)
	let lhsConst: Const | undefined;
	const lhsArg = parseArgument(expression.lhs);
	if (lhsArg.type === ArgumentType.LITERAL) {
		lhsConst = { value: lhsArg.value, isInteger: lhsArg.isInteger, ...(lhsArg.isFloat64 ? { isFloat64: true } : {}) };
	} else {
		lhsConst = consts[expression.lhs];
	}

	if (lhsConst === undefined) {
		return undefined;
	}

	// Resolve rhs: literal or constant only (no memory access)
	let rhsConst: Const | undefined;
	const rhsArg = parseArgument(expression.rhs);
	if (rhsArg.type === ArgumentType.LITERAL) {
		rhsConst = { value: rhsArg.value, isInteger: rhsArg.isInteger, ...(rhsArg.isFloat64 ? { isFloat64: true } : {}) };
	} else {
		rhsConst = consts[expression.rhs];
	}

	if (rhsConst === undefined) {
		return undefined;
	}

	if (expression.operator === '/' && rhsConst.value === 0) {
		return undefined;
	}

	return evaluateConstantExpression(lhsConst, rhsConst, expression.operator);
}

export function resolveConstantValueOrExpressionOrThrow(
	value: string,
	line: AST[number],
	context: CompilationContext
): Const {
	// Try resolving as a direct compile-time operand (literal, const, or metadata query)
	const directResult = resolveCompileTimeOperand(value, context.namespace);
	if (directResult !== undefined) {
		return directResult;
	}

	const expression = parseConstantMulDivExpression(value);

	if (!expression) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
	}

	const lhsConst = resolveCompileTimeOperand(expression.lhs, context.namespace);

	if (lhsConst === undefined) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: expression.lhs });
	}

	const rhsConst = resolveCompileTimeOperand(expression.rhs, context.namespace);

	if (rhsConst === undefined) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: expression.rhs });
	}

	if (expression.operator === '/' && rhsConst.value === 0) {
		throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
	}

	return evaluateConstantExpression(lhsConst, rhsConst, expression.operator);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('resolveConstantValue', () => {
		const mockLine = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'const',
			arguments: [{ type: ArgumentType.IDENTIFIER, value: 'A' }],
		} as unknown as AST[number];
		const mockContext = {
			namespace: {
				consts: {
					SIZE: { value: 16, isInteger: true },
					PI64: { value: 3.14159, isInteger: false, isFloat64: true },
				},
				memory: {
					samples: {
						numberOfElements: 8,
						elementWordSize: 2,
						isInteger: true,
					},
					floatBuf: {
						numberOfElements: 4,
						elementWordSize: 4,
						isInteger: false,
					},
				},
			},
		} as unknown as CompilationContext;

		it('resolves direct constants', () => {
			expect(resolveConstantValueOrExpressionOrThrow('SIZE', mockLine, mockContext)).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('resolves multiplication expression: constant * literal', () => {
			expect(resolveConstantValueOrExpressionOrThrow('SIZE*2', mockLine, mockContext)).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves division expression: constant / literal', () => {
			expect(resolveConstantValueOrExpressionOrThrow('SIZE/2', mockLine, mockContext)).toEqual({
				value: 8,
				isInteger: true,
			});
		});

		it('resolves literal * constant', () => {
			expect(resolveConstantValueOrExpressionOrThrow('2*SIZE', mockLine, mockContext)).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * literal', () => {
			expect(resolveConstantValueOrExpressionOrThrow('sizeof(samples)*2', mockLine, mockContext)).toEqual({
				value: 4,
				isInteger: true,
			});
		});

		it('resolves literal * sizeof(name)', () => {
			expect(resolveConstantValueOrExpressionOrThrow('123*sizeof(samples)', mockLine, mockContext)).toEqual({
				value: 246,
				isInteger: true,
			});
		});

		it('resolves constant * sizeof(name)', () => {
			expect(resolveConstantValueOrExpressionOrThrow('SIZE*sizeof(samples)', mockLine, mockContext)).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * constant', () => {
			expect(resolveConstantValueOrExpressionOrThrow('sizeof(samples)*SIZE', mockLine, mockContext)).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves count(name) * literal', () => {
			expect(resolveConstantValueOrExpressionOrThrow('count(samples)*2', mockLine, mockContext)).toEqual({
				value: 16,
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

		it('tryResolve handles literal * constant', () => {
			expect(tryResolveConstantValueOrExpression(mockContext.namespace.consts, '2*SIZE')).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('isConstantValueOrExpression detects literal * constant', () => {
			expect(isConstantValueOrExpression(mockContext.namespace.consts, '2*SIZE')).toBe(true);
		});

		it('isCompileTimeValueOrExpression detects sizeof expressions', () => {
			expect(isCompileTimeValueOrExpression(mockContext.namespace, 'sizeof(samples)*2')).toBe(true);
			expect(isCompileTimeValueOrExpression(mockContext.namespace, 'SIZE*sizeof(samples)')).toBe(true);
		});
	});
}
