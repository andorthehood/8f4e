import {
	ArgumentType,
	type CompilationContext,
	type CompilerASTLine,
	ErrorCode,
	type MemoryLayoutPlan,
} from '@8f4e/language-spec';
import { classifyIdentifier, parseArgument } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

import normalizeValueArguments from './normalizeValueArguments';

function createSourceMemoryPlan(): MemoryLayoutPlan {
	const buffer = {
		id: 'buffer',
		lineNumber: 1,
		numberOfElements: 4,
		elementWordSize: 4,
		wordAlignedAddress: 0,
		wordAlignedSize: 4,
		byteAddress: 0,
		type: 'int',
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		memoryIndex: 0,
	} as const;
	const source = {
		id: 'source',
		lineNumber: 1,
		byteAddress: 0,
		wordAlignedSize: 4,
		memory: { buffer },
		declarations: [buffer],
		declarationSources: [],
		memoryIndex: 0,
	};
	return {
		modules: { source },
		moduleList: [source],
		nextByteAddressByMemoryIndex: { 0: 16 },
	};
}

function createEmptyMemoryPlan(): MemoryLayoutPlan {
	return {
		modules: {},
		moduleList: [],
		nextByteAddressByMemoryIndex: {},
	};
}

describe('normalizeValueArguments', () => {
	it('folds push value expressions into literals', () => {
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [parseArgument('2*4')],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(normalizeValueArguments(line, context)).toEqual({
			...line,
			arguments: [{ type: ArgumentType.LITERAL, value: 8, isInteger: true }],
		});
	});

	it('leaves identifier-definition positions unchanged when not resolvable', () => {
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'int',
			arguments: [classifyIdentifier('output')],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(normalizeValueArguments(line, context)).toEqual(line);
	});

	it('folds map value arguments into literals', () => {
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'map',
			arguments: [parseArgument('4/2'), parseArgument('2*4')],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(normalizeValueArguments(line, context)).toEqual({
			...line,
			arguments: [
				{ type: ArgumentType.LITERAL, value: 2, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 8, isInteger: true },
			],
		});
	});

	it('throws when a targeted value expression cannot be resolved', () => {
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [parseArgument('2*MISSING')],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeValueArguments(line, context)).toThrow();
	});

	it('throws UNDECLARED_IDENTIFIER when a map key argument is an unresolved identifier', () => {
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'map',
			arguments: [classifyIdentifier('MISSING_CONST'), { type: ArgumentType.LITERAL, value: 100, isInteger: true }],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER when a map value argument is an unresolved identifier', () => {
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'map',
			arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }, classifyIdentifier('UNRESOLVED')],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER when a default argument is an unresolved identifier', () => {
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'default',
			arguments: [classifyIdentifier('MISSING_CONST')],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('resolves push identifier arguments when the identifier is a known local', () => {
		const local = { kind: 'value', valueType: 'int', index: 0 };
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('localVar')],
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
			},
			locals: { localVar: local },
		} as unknown as CompilationContext;

		expect(normalizeValueArguments(line, context)).toEqual({
			...line,
			resolvedTarget: { kind: 'local', local },
		});
	});

	it('throws UNDECLARED_IDENTIFIER for push with an identifier not in memory or locals', () => {
		const context = {
			namespace: { moduleName: 'test', namespaces: {} },
			memoryPlan: createEmptyMemoryPlan(),
			locals: {},
			startingByteAddress: 16,
			currentModuleWordAlignedSize: 3,
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('unknownVar')],
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for localSet with an undeclared local', () => {
		const context = {
			namespace: { moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'localSet',
			arguments: [classifyIdentifier('missing')],
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for push with undeclared intermodule reference', () => {
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: { otherModule: { kind: 'module' } },
			},
			memoryPlan: createEmptyMemoryPlan(),
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&otherModule:missingMemory')],
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for memory declaration with undeclared intermodule memory reference', () => {
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: { source: { kind: 'module' } },
			},
			memoryPlan: createSourceMemoryPlan(),
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'int',
			arguments: [classifyIdentifier('buffer'), classifyIdentifier('&source:missingBuffer')],
			hasExplicitMemoryDefault: true,
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('does not strip unresolved intermodule address defaults from memory declarations', () => {
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {
					source: {
						kind: 'module',
						// No byteAddress — module not yet laid out
					},
				},
			},
			memoryPlan: createSourceMemoryPlan(),
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'int',
			arguments: [classifyIdentifier('ptr'), classifyIdentifier('&source:buffer')],
			hasExplicitMemoryDefault: true,
		};

		const result = normalizeValueArguments(line, context);
		expect(result.arguments).toHaveLength(2);
		expect(result.arguments[0]).toEqual(classifyIdentifier('ptr'));
		expect(result.arguments[1]).toEqual(classifyIdentifier('&source:buffer'));
	});

	it('does not strip array declaration element count arguments', () => {
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {
					source: {
						kind: 'module',
					},
				},
			},
			memoryPlan: createSourceMemoryPlan(),
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'int[]',
			arguments: [classifyIdentifier('buffer'), classifyIdentifier('&source:buffer')],
			hasExplicitMemoryDefault: false,
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for memory declaration with unresolved value-expression default', () => {
		const context = {
			namespace: { moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'int',
			arguments: [classifyIdentifier('buffer'), parseArgument('2*MISSING')],
			hasExplicitMemoryDefault: true,
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('does not throw for valid intermodule reference when namespaces are populated', () => {
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {
					source: {
						kind: 'module',
					},
				},
			},
			memoryPlan: createSourceMemoryPlan(),
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&source:buffer')],
		};

		expect(normalizeValueArguments(line, context)).toEqual(line);
	});

	it('does not validate intermodule references before namespaces are collected', () => {
		const context = {
			namespace: { moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&otherModule:buffer')],
		};

		expect(normalizeValueArguments(line, context)).toEqual(line);
	});

	it('throws UNDECLARED_IDENTIFIER for push with &name when memory does not exist', () => {
		const context = {
			namespace: { moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&missing')],
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws for count(*localPointer) when the pointer has no element count metadata', () => {
		const context = {
			namespace: { moduleName: 'test', namespaces: {} },
			memoryPlan: createEmptyMemoryPlan(),
			locals: {
				lut: { kind: 'value', valueType: 'int', pointeeBaseType: 'float', pointerDepth: 1, index: 0 },
			},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('count(*lut)')],
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.POINTEE_ELEMENT_COUNT_UNKNOWN}`);
	});

	it('throws UNDEFINED_FUNCTION for call with an undeclared function target', () => {
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
				functions: { byId: {}, arityByName: {} },
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('missingFn')],
		};

		expect(() => normalizeValueArguments(line, context)).toThrow(`${ErrorCode.UNDEFINED_FUNCTION}`);
	});

	it('does not throw for call when functions registry is undefined', () => {
		const context = {
			namespace: { moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('anyFn')],
		};

		expect(normalizeValueArguments(line, context)).toEqual(line);
	});

	it('does not throw for call when the target function name is registered', () => {
		const targetFunction = { id: 'knownFn', name: 'knownFn', signature: { parameters: [], returns: [] }, wasmIndex: 2 };
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
				functions: {
					byId: { knownFn: targetFunction },
					arityByName: { knownFn: 0 },
				},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('knownFn')],
		};

		expect(normalizeValueArguments(line, context)).toEqual(line);
	});

	it('normalizes calls by source function name instead of compiler id', () => {
		const targetFunction = {
			id: 'knownFn__int',
			name: 'knownFn',
			signature: { parameters: ['int'], returns: [] },
			wasmIndex: 2,
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
				functions: {
					byId: { knownFn__int: targetFunction },
					arityByName: { knownFn: 1 },
				},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('knownFn')],
		};

		expect(normalizeValueArguments(line, context)).toEqual(line);
	});

	it('normalizes inline call arguments as push lines', () => {
		const targetFunction = {
			id: 'knownFn',
			name: 'knownFn',
			signature: { parameters: ['int'], returns: [] },
			wasmIndex: 2,
		};
		const context = {
			namespace: {
				moduleName: 'test',
				namespaces: {},
				functions: {
					byId: { knownFn: targetFunction },
					arityByName: { knownFn: 1 },
				},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: CompilerASTLine = {
			lineNumber: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('knownFn'), parseArgument('2*4')],
		};

		expect(normalizeValueArguments(line, context)).toEqual({
			...line,
			arguments: [classifyIdentifier('knownFn'), { type: ArgumentType.LITERAL, value: 8, isInteger: true }],
			inlineArgumentPushes: [
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.LITERAL, value: 8, isInteger: true }],
				},
			],
		});
	});
});
