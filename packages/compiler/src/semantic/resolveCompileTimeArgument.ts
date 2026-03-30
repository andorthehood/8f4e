import { parseArgument, ArgumentType } from '@8f4e/tokenizer';

import {
	getElementCount,
	getElementWordSize,
	getPointeeElementWordSize,
	getElementMaxValue,
	getPointeeElementMaxValue,
	getElementMinValue,
} from '../utils/memoryData';

import type { Argument, Const, Namespace } from '../types';

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

	// Not an identifier — bail out
	if (arg.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}

	// Try direct constant lookup
	const directConst = namespace.consts[operand];
	if (directConst !== undefined) {
		return directConst;
	}

	const { memory } = namespace;

	if (arg.referenceKind === 'intermodular-element-word-size') {
		const targetMemory = namespace.namespaces[arg.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, arg.targetMemoryId!)) {
			return { value: getElementWordSize(targetMemory, arg.targetMemoryId!), isInteger: true };
		}
		return undefined;
	}

	if (arg.referenceKind === 'intermodular-element-count') {
		const targetMemory = namespace.namespaces[arg.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, arg.targetMemoryId!)) {
			return { value: getElementCount(targetMemory, arg.targetMemoryId!), isInteger: true };
		}
		return undefined;
	}

	if (arg.referenceKind === 'intermodular-element-max') {
		const targetMemory = namespace.namespaces[arg.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, arg.targetMemoryId!)) {
			const memoryItem = targetMemory[arg.targetMemoryId!];
			return { value: getElementMaxValue(targetMemory, arg.targetMemoryId!), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	if (arg.referenceKind === 'intermodular-element-min') {
		const targetMemory = namespace.namespaces[arg.targetModuleId!]?.memory;
		if (targetMemory && Object.hasOwn(targetMemory, arg.targetMemoryId!)) {
			const memoryItem = targetMemory[arg.targetMemoryId!];
			return { value: getElementMinValue(targetMemory, arg.targetMemoryId!), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// sizeof(*name) — pointee element word size
	if (arg.referenceKind === 'pointee-element-word-size') {
		const base = arg.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			return { value: getPointeeElementWordSize(memory, base), isInteger: true };
		}
		return undefined;
	}

	// sizeof(name) — element word size
	if (arg.referenceKind === 'element-word-size') {
		const base = arg.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			return { value: getElementWordSize(memory, base), isInteger: true };
		}
		return undefined;
	}

	// count(name) — element count
	if (arg.referenceKind === 'element-count') {
		const base = arg.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			return { value: getElementCount(memory, base), isInteger: true };
		}
		return undefined;
	}

	// max(*name) — pointee element max value
	if (arg.referenceKind === 'pointee-element-max') {
		const base = arg.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getPointeeElementMaxValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// max(name) — element max value
	if (arg.referenceKind === 'element-max') {
		const base = arg.targetMemoryId!;
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return { value: getElementMaxValue(memory, base), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	// min(name) — element min value
	if (arg.referenceKind === 'element-min') {
		const base = arg.targetMemoryId!;
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
		const lhsConst = resolveCompileTimeOperand(argument.lhs, namespace);
		const rhsConst = resolveCompileTimeOperand(argument.rhs, namespace);

		if (lhsConst === undefined || rhsConst === undefined) {
			return undefined;
		}

		if (argument.operator === '/' && rhsConst.value === 0) {
			return undefined;
		}

		return evaluateConstantExpression(lhsConst, rhsConst, argument.operator);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}

	const parsedArgument = parseArgument(argument.value);
	if (parsedArgument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return tryResolveCompileTimeArgument(namespace, parsedArgument);
	}

	return resolveCompileTimeOperand(argument.value, namespace);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

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
