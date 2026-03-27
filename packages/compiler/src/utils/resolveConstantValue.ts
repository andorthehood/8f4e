import {
	getElementCount,
	getElementWordSize,
	getPointeeElementWordSize,
	getElementMaxValue,
	getPointeeElementMaxValue,
	getElementMinValue,
} from './memoryData';

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
import isIntermodularElementCountReference from '../syntax/isIntermodularElementCountReference';
import isIntermodularElementWordSizeReference from '../syntax/isIntermodularElementWordSizeReference';
import isIntermodularElementMaxReference from '../syntax/isIntermodularElementMaxReference';
import isIntermodularElementMinReference from '../syntax/isIntermodularElementMinReference';
import extractIntermodularElementCountBase from '../syntax/extractIntermodularElementCountBase';
import extractIntermodularElementWordSizeBase from '../syntax/extractIntermodularElementWordSizeBase';
import extractIntermodularElementMaxBase from '../syntax/extractIntermodularElementMaxBase';
import extractIntermodularElementMinBase from '../syntax/extractIntermodularElementMinBase';

import type { ArgumentCompileTimeExpression, Const, Namespace } from '../types';

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

	if (isIntermodularElementWordSizeReference(operand)) {
		const { module, memory: memoryId } = extractIntermodularElementWordSizeBase(operand);
		const targetMemory = namespace.namespaces[module]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, memoryId)) {
			return { value: getElementWordSize(targetMemory, memoryId), isInteger: true };
		}
		return undefined;
	}

	if (isIntermodularElementCountReference(operand)) {
		const { module, memory: memoryId } = extractIntermodularElementCountBase(operand);
		const targetMemory = namespace.namespaces[module]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, memoryId)) {
			return { value: getElementCount(targetMemory, memoryId), isInteger: true };
		}
		return undefined;
	}

	if (isIntermodularElementMaxReference(operand)) {
		const { module, memory: memoryId } = extractIntermodularElementMaxBase(operand);
		const targetMemory = namespace.namespaces[module]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, memoryId)) {
			const memoryItem = targetMemory[memoryId];
			return { value: getElementMaxValue(targetMemory, memoryId), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	if (isIntermodularElementMinReference(operand)) {
		const { module, memory: memoryId } = extractIntermodularElementMinBase(operand);
		const targetMemory = namespace.namespaces[module]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, memoryId)) {
			const memoryItem = targetMemory[memoryId];
			return { value: getElementMinValue(targetMemory, memoryId), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

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

export function tryResolveCompileTimeValueOrExpression(namespace: Namespace, value: string): Const | undefined {
	const directResult = resolveCompileTimeOperand(value, namespace);

	if (directResult !== undefined) {
		return directResult;
	}

	const expression = parseConstantMulDivExpression(value);

	if (!expression) {
		return undefined;
	}

	const lhsConst = resolveCompileTimeOperand(expression.lhs, namespace);
	const rhsConst = resolveCompileTimeOperand(expression.rhs, namespace);

	if (lhsConst === undefined || rhsConst === undefined) {
		return undefined;
	}

	if (expression.operator === '/' && rhsConst.value === 0) {
		return undefined;
	}

	return evaluateConstantExpression(lhsConst, rhsConst, expression.operator);
}

export function tryResolveCompileTimeValueOrExpressionNode(
	namespace: Namespace,
	expression: ArgumentCompileTimeExpression
): Const | undefined {
	const lhsConst = resolveCompileTimeOperand(expression.lhs, namespace);
	const rhsConst = resolveCompileTimeOperand(expression.rhs, namespace);

	if (lhsConst === undefined || rhsConst === undefined) {
		return undefined;
	}

	if (expression.operator === '/' && rhsConst.value === 0) {
		return undefined;
	}

	return evaluateConstantExpression(lhsConst, rhsConst, expression.operator);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('resolveConstantValue', () => {
		const mockNamespace = {
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
			namespaces: {},
		} as unknown as Namespace;

		it('resolves direct constants', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'SIZE')).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('resolves multiplication expression: constant * literal', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'SIZE*2')).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves division expression: constant / literal', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'SIZE/2')).toEqual({
				value: 8,
				isInteger: true,
			});
		});

		it('resolves literal * constant', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, '2*SIZE')).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * literal', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'sizeof(samples)*2')).toEqual({
				value: 4,
				isInteger: true,
			});
		});

		it('resolves literal * sizeof(name)', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, '123*sizeof(samples)')).toEqual({
				value: 246,
				isInteger: true,
			});
		});

		it('resolves constant * sizeof(name)', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'SIZE*sizeof(samples)')).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * constant', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'sizeof(samples)*SIZE')).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves count(name) * literal', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'count(samples)*2')).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('keeps float64 width for expression results', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'PI64*2')).toEqual({
				value: 6.28318,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('returns undefined for unresolved or chained expressions', () => {
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'SIZE/2/2')).toBeUndefined();
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'SIZE*2/2')).toBeUndefined();
			expect(tryResolveCompileTimeValueOrExpression(mockNamespace, 'MISSING')).toBeUndefined();
		});

		it('resolves intermodule sizeof expressions', () => {
			const intermodularNamespace = {
				...mockNamespace,
				namespaces: {
					source: {
						consts: {},
						memory: {
							buffer: {
								numberOfElements: 4,
								elementWordSize: 2,
								isInteger: true,
							},
						},
					},
				},
			} as unknown as Namespace;

			expect(tryResolveCompileTimeValueOrExpression(intermodularNamespace, '2*sizeof(source:buffer)')).toEqual({
				value: 4,
				isInteger: true,
			});
		});

		it('resolves explicit compile-time expression nodes', () => {
			expect(
				tryResolveCompileTimeValueOrExpressionNode(mockNamespace, {
					type: ArgumentType.COMPILE_TIME_EXPRESSION,
					lhs: '2',
					operator: '*',
					rhs: 'SIZE',
				})
			).toEqual({
				value: 32,
				isInteger: true,
			});
		});
	});
}
