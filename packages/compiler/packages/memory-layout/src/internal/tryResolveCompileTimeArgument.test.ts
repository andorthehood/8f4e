import { ArgumentType } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

import { tryResolveCompileTimeArgument } from './tryResolveCompileTimeArgument';

import type { PublicMemoryLayoutContext } from '../internalTypes';

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
					byteAddress: 24,
					wordAlignedSize: 4,
				},
				floatBuf: {
					numberOfElements: 4,
					elementWordSize: 4,
					isInteger: false,
					byteAddress: 40,
					wordAlignedSize: 4,
				},
			},
			namespaces: {},
			moduleName: 'test',
		},
		startingByteAddress: 24,
		currentModuleWordAlignedSize: 5,
		blockStack: [],
	} as unknown as PublicMemoryLayoutContext;

	it('resolves direct constants', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE'))).toEqual({
			value: 16,
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

	it('resolves intermodule sizeof expressions', () => {
		const intermodularNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				modules: {
					source: {
						byteAddress: 0,
						wordAlignedSize: 1,
						memory: {
							buffer: {
								numberOfElements: 4,
								elementWordSize: 2,
								isInteger: true,
								byteAddress: 0,
								wordAlignedSize: 2,
							},
						},
					},
				},
			},
		} as unknown as PublicMemoryLayoutContext;

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

	it('resolves exponentiation with sizeof: sizeof(name)^literal', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(samples)^2'))).toEqual({
			value: 4,
			isInteger: true,
		});
	});

	it('resolves intermodule start-address reference (&module:memory) once module is laid out', () => {
		const laidOutNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				modules: {
					source: {
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
		} as unknown as PublicMemoryLayoutContext;

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
				modules: {
					source: {
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
		} as unknown as PublicMemoryLayoutContext;

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
				modules: {
					source: {
						byteAddress: 12,
						wordAlignedSize: 3,
						memory: {},
					},
				},
			},
		} as unknown as PublicMemoryLayoutContext;

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
				modules: {
					source: {
						byteAddress: 12,
						wordAlignedSize: 3,
						memory: {},
					},
				},
			},
		} as unknown as PublicMemoryLayoutContext;

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
				modules: {
					source: {
						byteAddress: undefined,
						wordAlignedSize: undefined,
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
		} as unknown as PublicMemoryLayoutContext;

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
