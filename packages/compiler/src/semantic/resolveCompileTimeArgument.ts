import { ArgumentType } from '@8f4e/tokenizer';

import {
	getElementCount,
	getElementWordSize,
	getPointeeElementWordSize,
	getElementMaxValue,
	getPointeeElementMaxValue,
	getElementMinValue,
} from '../utils/memoryData';

import type { Argument, CompileTimeOperand, Const, Namespace } from '../types';

/**
 * Tries to resolve a single pre-classified compile-time operand to a `Const` value.
 * Dispatches on the operand's AST classification (`type` and `referenceKind`) directly,
 * without re-parsing raw token values. Handles numeric literals, constant identifiers,
 * and memory metadata queries (sizeof, count, max, min — including pointee forms).
 * Returns `undefined` if the operand cannot be resolved from the available context.
 */
function resolveCompileTimeOperand(operand: CompileTimeOperand, namespace: Namespace): Const | undefined {
	if (operand.type === ArgumentType.LITERAL) {
		return { value: operand.value, isInteger: operand.isInteger, ...(operand.isFloat64 ? { isFloat64: true } : {}) };
	}

	// Dispatch on referenceKind as the primary axis.
	// Constant and plain identifiers are the only kinds that can appear in the const map.
	if (operand.referenceKind === 'constant' || operand.referenceKind === 'plain') {
		return namespace.consts[operand.value];
	}

	const { memory } = namespace;

	if (operand.referenceKind === 'intermodular-element-word-size') {
		const targetMemory = namespace.namespaces[operand.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId!)) {
			return { value: getElementWordSize(targetMemory, operand.targetMemoryId!), isInteger: true };
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-count') {
		const targetMemory = namespace.namespaces[operand.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId!)) {
			return { value: getElementCount(targetMemory, operand.targetMemoryId!), isInteger: true };
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-max') {
		const targetMemory = namespace.namespaces[operand.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId!)) {
			const memoryItem = targetMemory[operand.targetMemoryId!];
			return { value: getElementMaxValue(targetMemory, operand.targetMemoryId!), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-min') {
		const targetMemory = namespace.namespaces[operand.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId!)) {
			const memoryItem = targetMemory[operand.targetMemoryId!];
			return { value: getElementMinValue(targetMemory, operand.targetMemoryId!), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// sizeof(*name) — pointee element word size
	if (operand.referenceKind === 'pointee-element-word-size') {
		const base = operand.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			return { value: getPointeeElementWordSize(memory, base), isInteger: true };
		}
		return undefined;
	}

	// sizeof(name) — element word size
	if (operand.referenceKind === 'element-word-size') {
		const base = operand.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			return { value: getElementWordSize(memory, base), isInteger: true };
		}
		return undefined;
	}

	// count(name) — element count
	if (operand.referenceKind === 'element-count') {
		const base = operand.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			return { value: getElementCount(memory, base), isInteger: true };
		}
		return undefined;
	}

	// max(*name) — pointee element max value
	if (operand.referenceKind === 'pointee-element-max') {
		const base = operand.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getPointeeElementMaxValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// max(name) — element max value
	if (operand.referenceKind === 'element-max') {
		const base = operand.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getElementMaxValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// min(name) — element min value
	if (operand.referenceKind === 'element-min') {
		const base = operand.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getElementMinValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	return undefined;
}

function evaluateConstantExpression(lhsConst: Const, rhsConst: Const, operator: '*' | '/'): Const {
	const value = operator === '*' ? lhsConst.value * rhsConst.value : lhsConst.value / rhsConst.value;
	const isFloat64 = !!lhsConst.isFloat64 || !!rhsConst.isFloat64;
	const isInteger = !isFloat64 && lhsConst.isInteger && rhsConst.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}

export function tryResolveCompileTimeArgument(namespace: Namespace, argument: Argument): Const | undefined {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveCompileTimeOperand(argument.left, namespace);
		const rightConst = resolveCompileTimeOperand(argument.right, namespace);

		if (leftConst === undefined || rightConst === undefined) {
			return undefined;
		}

		if (argument.operator === '/' && rightConst.value === 0) {
			return undefined;
		}

		return evaluateConstantExpression(leftConst, rightConst, argument.operator);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}

	return resolveCompileTimeOperand(argument, namespace);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier, parseArgument, parseCompileTimeOperand } = await import('@8f4e/tokenizer');

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
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('SIZE'))).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('resolves multiplication expression: constant * literal', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('SIZE*2'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves division expression: constant / literal', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('SIZE/2'))).toEqual({
				value: 8,
				isInteger: true,
			});
		});

		it('resolves literal * constant', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('2*SIZE'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * literal', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('sizeof(samples)*2'))).toEqual({
				value: 4,
				isInteger: true,
			});
		});

		it('resolves literal * sizeof(name)', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('123*sizeof(samples)'))).toEqual({
				value: 246,
				isInteger: true,
			});
		});

		it('resolves constant * sizeof(name)', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('SIZE*sizeof(samples)'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * constant', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('sizeof(samples)*SIZE'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves count(name) * literal', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('count(samples)*2'))).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('keeps float64 width for expression results', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('PI64*2'))).toEqual({
				value: 6.28318,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('returns undefined for unresolved or chained expressions', () => {
			expect(tryResolveCompileTimeArgument(mockNamespace, parseArgument('MISSING'))).toBeUndefined();
			expect(tryResolveCompileTimeArgument(mockNamespace, classifyIdentifier('SIZE/2/2'))).toBeUndefined();
			expect(tryResolveCompileTimeArgument(mockNamespace, classifyIdentifier('SIZE*2/2'))).toBeUndefined();
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

			expect(tryResolveCompileTimeArgument(intermodularNamespace, parseArgument('2*sizeof(source:buffer)'))).toEqual({
				value: 4,
				isInteger: true,
			});
		});

		it('resolves explicit compile-time expression nodes', () => {
			expect(
				tryResolveCompileTimeArgument(mockNamespace, {
					type: ArgumentType.COMPILE_TIME_EXPRESSION,
					left: parseCompileTimeOperand('2'),
					operator: '*',
					right: parseCompileTimeOperand('SIZE'),
					intermoduleIds: [],
				})
			).toEqual({
				value: 32,
				isInteger: true,
			});
		});
	});
}
