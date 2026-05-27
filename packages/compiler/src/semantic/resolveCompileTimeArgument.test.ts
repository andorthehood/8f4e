import { ArgumentType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import { tryResolveCompileTimeArgument } from './resolveCompileTimeArgument';

import type { CompilationContext } from '@8f4e/compiler-spec';

const { classifyIdentifier, parseArgument, parseCompileTimeOperand } = await import('@8f4e/tokenizer');

describe('tryResolveCompileTimeArgument', () => {
	const mockContext = {
		namespace: {
			consts: {
				BAR: { value: 5, isInteger: true },
				SIZE: { value: 16, isInteger: true },
				PI64: { value: 3.14159, isInteger: false },
			},
			memory: {
				samples: {
					id: 'samples',
					byteAddress: 32,
					numberOfElements: 8,
					elementWordSize: 2,
					wordAlignedSize: 4,
					isInteger: true,
				},
				floatBuf: {
					numberOfElements: 4,
					elementWordSize: 4,
					isInteger: false,
				},
				floatPtr: {
					numberOfElements: 1,
					elementWordSize: 1,
					isInteger: true,
					pointeeBaseType: 'float',
				},
			},
			namespaces: {},
		},
		startingByteAddress: 24,
		currentModuleWordAlignedSize: 5,
		locals: {},
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

	it('resolves division expression: signed literal / constant', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('-1/SIZE'))).toEqual({
			value: -0.0625,
			isInteger: false,
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

	it('resolves local memory metadata queries', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(*floatPtr)'))).toEqual({
			value: 4,
			isInteger: true,
		});
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('max(*floatPtr)'))).toEqual({
			value: 3.4028234663852886e38,
			isInteger: false,
		});
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('max(samples)'))).toEqual({
			value: 32767,
			isInteger: true,
		});
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('min(samples)'))).toEqual({
			value: -32768,
			isInteger: true,
		});
	});

	it('returns undefined for unresolved local memory metadata queries', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(missing)'))).toBeUndefined();
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('count(missing)'))).toBeUndefined();
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('max(missing)'))).toBeUndefined();
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('min(missing)'))).toBeUndefined();
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(*missing)'))).toBeUndefined();
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('max(*missing)'))).toBeUndefined();
	});

	it('keeps float64 width for expression results', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('PI64*2'))).toEqual({
			value: 6.28318,
			isInteger: false,
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
						kind: 'module',
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

	it('treats max(*localDoublePointer) as an integer-valued pointer slot even for float pointees', () => {
		const localPointerContext = {
			...mockContext,
			locals: {
				floatPtrPtr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'float64',
					isPointingToPointer: true,
					index: 0,
				},
			},
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(localPointerContext, parseArgument('max(*floatPtrPtr)'))).toEqual({
			value: 2147483647,
			isInteger: true,
		});
	});

	it('resolves pointee metadata from local pointer bindings', () => {
		const localPointerContext = {
			...mockContext,
			locals: {
				floatPtr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'float',
					index: 0,
				},
			},
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(localPointerContext, parseArgument('sizeof(*floatPtr)'))).toEqual({
			value: 4,
			isInteger: true,
		});
		expect(tryResolveCompileTimeArgument(localPointerContext, parseArgument('max(*floatPtr)'))).toEqual({
			value: 3.4028234663852886e38,
			isInteger: false,
		});
	});

	it('resolves non-word-sized pointee widths from local pointer bindings', () => {
		const localPointerContext = {
			...mockContext,
			locals: {
				int8Ptr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'int8',
					index: 0,
				},
				int16Ptr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'int16',
					index: 1,
				},
				float64Ptr: {
					kind: 'value',
					valueType: 'int',
					pointeeBaseType: 'float64',
					index: 2,
				},
			},
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(localPointerContext, parseArgument('sizeof(*int8Ptr)'))).toEqual({
			value: 1,
			isInteger: true,
		});
		expect(tryResolveCompileTimeArgument(localPointerContext, parseArgument('sizeof(*int16Ptr)'))).toEqual({
			value: 2,
			isInteger: true,
		});
		expect(tryResolveCompileTimeArgument(localPointerContext, parseArgument('sizeof(*float64Ptr)'))).toEqual({
			value: 8,
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

	it('resolves exponentiation expression: constant ^ literal', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE^2'))).toEqual({
			value: 256,
			isInteger: true,
		});
	});

	it('resolves exponentiation expression: literal ^ constant', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('2^SIZE'))).toEqual({
			value: 65536,
			isInteger: true,
		});
	});

	it('keeps float64 width for exponentiation results', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('PI64^2'))).toEqual({
			value: Math.pow(3.14159, 2),
			isInteger: false,
		});
	});

	it('resolves exponentiation with sizeof: sizeof(name)^literal', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(samples)^2'))).toEqual({
			value: 4,
			isInteger: true,
		});
	});

	it('resolves addition expression: constant + literal', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE+1'))).toEqual({
			value: 17,
			isInteger: true,
		});
	});

	it('resolves addition expression: constant + constant', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE+BAR'))).toEqual({
			value: 21,
			isInteger: true,
		});
	});

	it('resolves subtraction expression: constant - literal', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE-1'))).toEqual({
			value: 15,
			isInteger: true,
		});
	});

	it('resolves addition expression: literal + constant', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('1+SIZE'))).toEqual({
			value: 17,
			isInteger: true,
		});
	});

	it('resolves subtraction expression: literal - constant', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('100-SIZE'))).toEqual({
			value: 84,
			isInteger: true,
		});
	});

	it('resolves addition with sizeof: sizeof(name)+1', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(samples)+1'))).toEqual({
			value: 3,
			isInteger: true,
		});
	});

	it('resolves subtraction with sizeof: sizeof(name)-1', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('sizeof(samples)-1'))).toEqual({
			value: 1,
			isInteger: true,
		});
	});

	it('keeps float64 width for addition results', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('PI64+1'))).toEqual({
			value: 3.14159 + 1,
			isInteger: false,
		});
	});

	it('keeps float64 width for subtraction results', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('PI64-1'))).toEqual({
			value: 3.14159 - 1,
			isInteger: false,
		});
	});

	it('resolves intermodule start-address reference (&module:memory) once module is laid out', () => {
		const laidOutNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				namespaces: {
					source: {
						kind: 'module',
						consts: {},
						byteAddress: 8,
						wordAlignedSize: 4,
						memory: {
							buffer: {
								byteAddress: 8,
								wordAlignedSize: 4,
								numberOfElements: 4,
								elementWordSize: 4,
								memoryIndex: 0,
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
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 8,
					safeByteLength: 16,
					moduleId: 'source',
				},
			},
		});
	});

	it('resolves intermodule end-address reference (module:memory&) once module is laid out', () => {
		const laidOutNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				namespaces: {
					source: {
						kind: 'module',
						consts: {},
						byteAddress: 8,
						wordAlignedSize: 4,
						memory: {
							buffer: {
								byteAddress: 8,
								wordAlignedSize: 4,
								numberOfElements: 4,
								elementWordSize: 4,
								memoryIndex: 0,
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
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-end',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 4,
					moduleId: 'source',
				},
			},
		});
	});

	it('resolves intermodule module-base start-address (&module:) once module is laid out', () => {
		const laidOutNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				namespaces: {
					source: {
						kind: 'module',
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
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-start',
					memoryIndex: 0,
					byteAddress: 12,
					safeByteLength: 12,
					moduleId: 'source',
				},
			},
		});
	});

	it('resolves intermodule module-base end-address (module:&) once module is laid out', () => {
		const laidOutNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				namespaces: {
					source: {
						kind: 'module',
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
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-end',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 4,
					moduleId: 'source',
				},
			},
		});
	});

	it('defers intermodule address resolution until module byteAddress is known', () => {
		const unlaidOutNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				namespaces: {
					source: {
						kind: 'module',
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

	it('returns undefined for unresolved intermodule nth references', () => {
		const laidOutNamespace = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				namespaces: {
					source: {
						kind: 'module',
						consts: {},
						byteAddress: 8,
						wordAlignedSize: 4,
						memory: {},
					},
				},
			},
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(laidOutNamespace, classifyIdentifier('&source:99'))).toBeUndefined();
		expect(tryResolveCompileTimeArgument(mockContext, classifyIdentifier('&source:99'))).toBeUndefined();
	});

	it('resolves current-module shorthands from compilation context', () => {
		expect(tryResolveCompileTimeArgument(mockContext, classifyIdentifier('&this'))).toEqual({
			value: 24,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-start',
					memoryIndex: 0,
					byteAddress: 24,
					safeByteLength: 20,
				},
			},
		});
		expect(tryResolveCompileTimeArgument(mockContext, classifyIdentifier('this&'))).toEqual({
			value: 40,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'module-end',
					memoryIndex: 0,
					byteAddress: 40,
					safeByteLength: 4,
				},
			},
		});
	});

	it('returns undefined for current-module end address before module size is known', () => {
		const contextWithoutModuleSize = {
			...mockContext,
			currentModuleWordAlignedSize: undefined,
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(contextWithoutModuleSize, classifyIdentifier('this&'))).toBeUndefined();
	});

	it('keeps address metadata when adding an in-range integer offset to an address expression', () => {
		const addressContext = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				memory: {
					arr: {
						id: 'arr',
						byteAddress: 16,
						wordAlignedSize: 4,
						numberOfElements: 4,
						elementWordSize: 4,
						memoryIndex: 0,
						isInteger: true,
					},
				},
			},
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(addressContext, parseArgument('&arr+4'))).toEqual({
			value: 20,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 12,
					memoryId: 'arr',
				},
			},
		});
	});

	it('keeps address metadata when adding an address expression to an integer offset', () => {
		const addressContext = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				memory: {
					arr: {
						id: 'arr',
						byteAddress: 16,
						wordAlignedSize: 4,
						numberOfElements: 4,
						elementWordSize: 4,
						memoryIndex: 0,
						isInteger: true,
					},
				},
			},
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(addressContext, parseArgument('4+&arr'))).toEqual({
			value: 20,
			isInteger: true,
			address: {
				memoryIndex: 0,
				safeRange: {
					source: 'memory-start',
					memoryIndex: 0,
					byteAddress: 20,
					safeByteLength: 12,
					memoryId: 'arr',
				},
			},
		});
	});

	it('drops address metadata when address expression arithmetic leaves the known safe range', () => {
		const addressContext = {
			...mockContext,
			namespace: {
				...mockContext.namespace,
				memory: {
					arr: {
						id: 'arr',
						byteAddress: 16,
						wordAlignedSize: 4,
						numberOfElements: 4,
						elementWordSize: 4,
						isInteger: true,
					},
				},
			},
		} as unknown as CompilationContext;

		expect(tryResolveCompileTimeArgument(addressContext, parseArgument('&arr+1024'))).toEqual({
			value: 1040,
			isInteger: true,
		});
		expect(tryResolveCompileTimeArgument(addressContext, parseArgument('&arr-4'))).toEqual({
			value: 12,
			isInteger: true,
		});
	});

	it('returns undefined for division by zero and non-identifier arguments', () => {
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('SIZE/0'))).toBeUndefined();
		expect(tryResolveCompileTimeArgument(mockContext, parseArgument('123'))).toBeUndefined();
	});
});
