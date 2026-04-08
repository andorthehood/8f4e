import { ArgumentType } from '@8f4e/tokenizer';

import {
	getDataStructureByteAddress,
	getElementCount,
	getElementWordSize,
	getMemoryStringLastByteAddress,
	getPointeeElementWordSize,
	getElementMaxValue,
	getPointeeElementMaxValue,
	getElementMinValue,
} from '../utils/memoryData';
import { getEndByteAddress, getModuleEndByteAddress } from './layoutAddresses';

import type { Argument, CompilationContext, CompileTimeOperand, Const } from '../types';

/**
 * Tries to resolve a single pre-classified compile-time operand to a `Const` value.
 * Dispatches on the operand's AST classification (`type` and `referenceKind`) directly,
 * without re-parsing raw token values. Handles numeric literals, constant identifiers,
 * and memory metadata queries (sizeof, count, max, min — including pointee forms).
 * Returns `undefined` if the operand cannot be resolved from the available context.
 */
function resolveCompileTimeOperand(operand: CompileTimeOperand, context: CompilationContext): Const | undefined {
	const { namespace } = context;
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
		const targetMemory =
			namespace.namespaces[operand.targetModuleId!]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId!]?.memory
				: undefined;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId!)) {
			return { value: getElementWordSize(targetMemory, operand.targetMemoryId!), isInteger: true };
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-count') {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId!]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId!]?.memory
				: undefined;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId!)) {
			return { value: getElementCount(targetMemory, operand.targetMemoryId!), isInteger: true };
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-max') {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId!]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId!]?.memory
				: undefined;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId!)) {
			const memoryItem = targetMemory[operand.targetMemoryId!];
			return { value: getElementMaxValue(targetMemory, operand.targetMemoryId!), isInteger: !!memoryItem?.isInteger };
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-min') {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId!]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId!]?.memory
				: undefined;
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

	// &module: — start byte address of a module
	// module:& — end-word base byte address of a module
	if (operand.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = operand.targetModuleId!;
		const targetNamespace = namespace.namespaces[targetModuleId];
		if (
			targetNamespace?.kind === 'module' &&
			typeof targetNamespace.byteAddress === 'number' &&
			typeof targetNamespace.wordAlignedSize === 'number'
		) {
			const value = operand.isEndAddress
				? getModuleEndByteAddress(targetNamespace.byteAddress, targetNamespace.wordAlignedSize)
				: targetNamespace.byteAddress;
			return { value, isInteger: true };
		}
		return undefined;
	}

	// &module:N — start byte address of the Nth memory item (0-indexed) within a module
	if (operand.referenceKind === 'intermodular-module-nth-reference') {
		const targetModuleId = operand.targetModuleId!;
		const targetNamespace = namespace.namespaces[targetModuleId];
		if (targetNamespace?.kind !== 'module' || typeof targetNamespace.byteAddress !== 'number' || !targetNamespace.memory) {
			return undefined;
		}
		const items = Object.values(targetNamespace.memory);
		const item = items[operand.targetMemoryIndex!];
		if (item) {
			return { value: item.byteAddress, isInteger: true };
		}
		return undefined;
	}

	// &module:memory — start byte address of a remote memory item
	// module:memory& — end-word base byte address of a remote memory item
	if (operand.referenceKind === 'intermodular-reference') {
		const targetModuleId = operand.targetModuleId!;
		const targetNamespace = namespace.namespaces[targetModuleId];
		// Only resolve once the target module has been laid out (byteAddress is set on the namespace entry)
		if (targetNamespace?.kind !== 'module' || typeof targetNamespace.byteAddress !== 'number') {
			return undefined;
		}
		const targetMemory = targetNamespace.memory?.[operand.targetMemoryId!];
		if (targetMemory) {
			const value = operand.isEndAddress ? getEndByteAddress(targetMemory.byteAddress, targetMemory.wordAlignedSize) : targetMemory.byteAddress;
			return { value, isInteger: true };
		}
		return undefined;
	}

	// &name — start byte address of a local memory item
	// name& — end-word base byte address of a local memory item
	if (operand.referenceKind === 'memory-reference') {
		const base = operand.targetMemoryId!;
		if (base === 'this') {
			if (!operand.isEndAddress) {
				return { value: context.startingByteAddress, isInteger: true };
			}
			if (typeof context.currentModuleWordAlignedSize === 'number') {
				return {
					value: getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize),
					isInteger: true,
				};
			}
			return undefined;
		}
		if (Object.hasOwn(memory, base)) {
			const value = operand.isEndAddress
				? getMemoryStringLastByteAddress(memory, base)
				: getDataStructureByteAddress(memory, base);
			return { value, isInteger: true };
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

export function tryResolveCompileTimeArgument(context: CompilationContext, argument: Argument): Const | undefined {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveCompileTimeOperand(argument.left, context);
		const rightConst = resolveCompileTimeOperand(argument.right, context);

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

	return resolveCompileTimeOperand(argument, context);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier, parseArgument, parseCompileTimeOperand } = await import('@8f4e/tokenizer');

	describe('tryResolveCompileTimeArgument', () => {
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
				namespaces: {},
			},
			startingByteAddress: 24,
			currentModuleWordAlignedSize: 5,
		} as unknown as CompilationContext;

		it('resolves direct constants', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE'))).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('resolves multiplication expression: constant * literal', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE*2'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves division expression: constant / literal', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE/2'))).toEqual({
				value: 8,
				isInteger: true,
			});
		});

		it('resolves literal * constant', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('2*SIZE'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * literal', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(samples)*2'))).toEqual({
				value: 4,
				isInteger: true,
			});
		});

		it('resolves literal * sizeof(name)', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('123*sizeof(samples)'))).toEqual({
				value: 246,
				isInteger: true,
			});
		});

		it('resolves constant * sizeof(name)', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE*sizeof(samples)'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves sizeof(name) * constant', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(samples)*SIZE'))).toEqual({
				value: 32,
				isInteger: true,
			});
		});

		it('resolves count(name) * literal', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('count(samples)*2'))).toEqual({
				value: 16,
				isInteger: true,
			});
		});

		it('keeps float64 width for expression results', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('PI64*2'))).toEqual({
				value: 6.28318,
				isInteger: false,
				isFloat64: true,
			});
		});

		it('returns undefined for unresolved or chained expressions', () => {
			expect(tryResolveCompileTimeArgument(mockContext, parseArgument('MISSING'))).toBeUndefined();
			expect(tryResolveCompileTimeArgument(mockContext, classifyIdentifier('SIZE/2/2'))).toBeUndefined();
			expect(tryResolveCompileTimeArgument(mockContext, classifyIdentifier('SIZE*2/2'))).toBeUndefined();
		});

		it('resolves intermodule sizeof expressions', () => {
			const intermodularNamespace = {
				...mockContext,
				namespace: {
					...mockContext.namespace,
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
				},
			} as unknown as CompilationContext;

			expect(tryResolveCompileTimeArgument(intermodularNamespace, parseArgument('2*sizeof(source:buffer)'))).toEqual({
				value: 4,
				isInteger: true,
			});
		});

		it('resolves explicit compile-time expression nodes', () => {
			expect(
				tryResolveCompileTimeArgument(mockContext, {
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

		it('resolves intermodule start-address reference (&module:memory) once module is laid out', () => {
			const laidOutNamespace = {
				...mockContext,
				namespace: {
					...mockContext.namespace,
					namespaces: {
						source: {
							consts: {},
							byteAddress: 8,
							wordAlignedSize: 4,
							memory: {
								buffer: {
									byteAddress: 8,
									wordAlignedSize: 4,
									numberOfElements: 4,
									elementWordSize: 4,
									isInteger: true,
								},
							},
						},
					},
				},
			} as unknown as CompilationContext;

			expect(tryResolveCompileTimeArgument(laidOutNamespace, classifyIdentifier('&source:buffer'))).toEqual({
				value: 8,
				isInteger: true,
			});
		});

		it('resolves intermodule end-address reference (module:memory&) once module is laid out', () => {
			const laidOutNamespace = {
				...mockContext,
				namespace: {
					...mockContext.namespace,
					namespaces: {
						source: {
							consts: {},
							byteAddress: 8,
							wordAlignedSize: 4,
							memory: {
								buffer: {
									byteAddress: 8,
									wordAlignedSize: 4,
									numberOfElements: 4,
									elementWordSize: 4,
									isInteger: true,
								},
							},
						},
					},
				},
			} as unknown as CompilationContext;

			// End address = byteAddress + (wordAlignedSize - 1) * 4 = 8 + 3 * 4 = 20
			expect(tryResolveCompileTimeArgument(laidOutNamespace, classifyIdentifier('source:buffer&'))).toEqual({
				value: 20,
				isInteger: true,
			});
		});

		it('resolves intermodule module-base start-address (&module:) once module is laid out', () => {
			const laidOutNamespace = {
				...mockContext,
				namespace: {
					...mockContext.namespace,
					namespaces: {
						source: {
							consts: {},
							byteAddress: 12,
							wordAlignedSize: 3,
							memory: {},
						},
					},
				},
			} as unknown as CompilationContext;

			expect(tryResolveCompileTimeArgument(laidOutNamespace, classifyIdentifier('&source:'))).toEqual({
				value: 12,
				isInteger: true,
			});
		});

		it('resolves intermodule module-base end-address (module:&) once module is laid out', () => {
			const laidOutNamespace = {
				...mockContext,
				namespace: {
					...mockContext.namespace,
					namespaces: {
						source: {
							consts: {},
							byteAddress: 12,
							wordAlignedSize: 3,
							memory: {},
						},
					},
				},
			} as unknown as CompilationContext;

			// End address = 12 + (3 - 1) * 4 = 12 + 8 = 20
			expect(tryResolveCompileTimeArgument(laidOutNamespace, classifyIdentifier('source:&'))).toEqual({
				value: 20,
				isInteger: true,
			});
		});

		it('defers intermodule address resolution until module byteAddress is known', () => {
			const unlaidOutNamespace = {
				...mockContext,
				namespace: {
					...mockContext.namespace,
					namespaces: {
						source: {
							consts: {},
							// No byteAddress — module not yet laid out
							memory: {
								buffer: {
									numberOfElements: 4,
									elementWordSize: 4,
									isInteger: true,
								},
							},
						},
					},
				},
			} as unknown as CompilationContext;

			expect(tryResolveCompileTimeArgument(unlaidOutNamespace, classifyIdentifier('&source:buffer'))).toBeUndefined();
			expect(tryResolveCompileTimeArgument(unlaidOutNamespace, classifyIdentifier('&source:'))).toBeUndefined();
		});

		it('resolves current-module shorthands from compilation context', () => {
			expect(tryResolveCompileTimeArgument(mockContext, classifyIdentifier('&this'))).toEqual({
				value: 24,
				isInteger: true,
			});
			expect(tryResolveCompileTimeArgument(mockContext, classifyIdentifier('this&'))).toEqual({
				value: 40,
				isInteger: true,
			});
		});
	});
}
