import { describe, expect, it } from 'vitest';
import { classifyIdentifier, parseArgument } from '@8f4e/tokenizer';

import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';

import { ArgumentType, type AST, type CompilationContext } from '../types';
import { ErrorCode } from '../compilerError';

describe('normalizeCompileTimeArguments', () => {
	it('folds compile-time push expressions into literals', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [parseArgument('2*SIZE')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: { SIZE: { value: 8, isInteger: true } },
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(normalizeCompileTimeArguments(line, context)).toEqual({
			...line,
			arguments: [{ type: ArgumentType.LITERAL, value: 16, isInteger: true }],
		});
	});

	it('leaves identifier-definition positions unchanged when not resolvable', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'int',
			arguments: [classifyIdentifier('output')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
	});

	it('folds compile-time map arguments into literals', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'map',
			arguments: [parseArgument('SIZE/2'), parseArgument('2*SIZE')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: { SIZE: { value: 8, isInteger: true } },
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(normalizeCompileTimeArguments(line, context)).toEqual({
			...line,
			arguments: [
				{ type: ArgumentType.LITERAL, value: 4, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 16, isInteger: true },
			],
		});
	});

	it('throws when a targeted compile-time expression cannot be resolved', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [parseArgument('2*MISSING')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow();
	});

	it('throws UNDECLARED_IDENTIFIER when a map key argument is an unresolved identifier', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'map',
			arguments: [classifyIdentifier('MISSING_CONST'), { type: ArgumentType.LITERAL, value: 100, isInteger: true }],
		};
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER when a map value argument is an unresolved identifier', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'map',
			arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }, classifyIdentifier('UNRESOLVED')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER when a default argument is an unresolved identifier', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'default',
			arguments: [classifyIdentifier('MISSING_CONST')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER when a const value remains an unresolved compile-time expression', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'const',
			arguments: [classifyIdentifier('SIZE'), parseArgument('2*MISSING')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('leaves push identifier arguments unchanged when the identifier is a known local', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('localVar')],
		};
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: { localVar: { isInteger: true, index: 0 } },
		} as unknown as CompilationContext;

		expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
	});

	it('throws UNDECLARED_IDENTIFIER for push with an identifier not in memory or locals', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('unknownVar')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER when an init default remains an unresolved compile-time expression', () => {
		const context = {
			namespace: {
				memory: { target: { numberOfElements: 1, elementWordSize: 4, isInteger: true } },
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'init',
			arguments: [classifyIdentifier('target'), parseArgument('2*MISSING')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for localSet with an undeclared local', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'localSet',
			arguments: [classifyIdentifier('missing')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for push with undeclared intermodule reference', () => {
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: { otherModule: { consts: {}, memory: {} } },
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&otherModule:missingMemory')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for init with undeclared intermodule module reference', () => {
		const context = {
			namespace: {
				memory: { target: { numberOfElements: 1, elementWordSize: 4, isInteger: true } },
				consts: {},
				moduleName: 'test',
				namespaces: { knownModule: { consts: {}, memory: {} } },
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'init',
			arguments: [classifyIdentifier('target'), classifyIdentifier('&missingModule:')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDECLARED_IDENTIFIER for memory declaration with undeclared intermodule memory reference', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: { source: { consts: {}, memory: {} } } },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'int',
			isMemoryDeclaration: true,
			arguments: [classifyIdentifier('buffer'), classifyIdentifier('&source:missingBuffer')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('strips unresolvable intermodule address default from memory declaration during layout pass', () => {
		// When the target module exists in namespaces but has not yet been laid out (no byteAddress),
		// the default argument must be stripped rather than kept as-is for the parser to fabricate 0.
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {
					source: {
						consts: {},
						// No byteAddress — module not yet laid out
						memory: {
							buffer: { numberOfElements: 4, elementWordSize: 4, isInteger: true },
						},
					},
				},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'int',
			isMemoryDeclaration: true,
			arguments: [classifyIdentifier('ptr'), classifyIdentifier('&source:buffer')],
		};

		const result = normalizeCompileTimeArguments(line, context);
		// The unresolvable default must be stripped; only the name argument remains
		expect(result.arguments).toHaveLength(1);
		expect(result.arguments[0]).toEqual(classifyIdentifier('ptr'));
	});

	it('throws UNDECLARED_IDENTIFIER for memory declaration with unresolved compile-time-expression default', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'int',
			isMemoryDeclaration: true,
			arguments: [classifyIdentifier('buffer'), parseArgument('2*MISSING')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('does not throw for valid intermodule reference when namespaces are populated', () => {
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {
					source: {
						consts: {},
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
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&source:buffer')],
		};

		expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
	});

	it('does not validate intermodule references when namespaces dict is empty (prepass)', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&otherModule:buffer')],
		};

		expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
	});

	it('inlines local &name start address to a literal during push normalization', () => {
		const context = {
			namespace: {
				memory: {
					buffer: {
						id: 'buffer',
						numberOfElements: 4,
						elementWordSize: 4,
						wordAlignedAddress: 3,
						wordAlignedSize: 4,
						byteAddress: 12,
						default: 0,
						isInteger: true,
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int',
					},
				},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&buffer')],
		};

		expect(normalizeCompileTimeArguments(line, context)).toEqual({
			...line,
			arguments: [{ type: ArgumentType.LITERAL, value: 12, isInteger: true }],
		});
	});

	it('inlines local name& end address to a literal during push normalization', () => {
		const context = {
			namespace: {
				memory: {
					buffer: {
						id: 'buffer',
						numberOfElements: 4,
						elementWordSize: 4,
						wordAlignedAddress: 3,
						wordAlignedSize: 4,
						byteAddress: 12,
						default: 0,
						isInteger: true,
						isPointingToPointer: false,
						isUnsigned: false,
						type: 'int',
					},
				},
				consts: {},
				moduleName: 'test',
				namespaces: {},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('buffer&')],
		};

		expect(normalizeCompileTimeArguments(line, context)).toEqual({
			...line,
			arguments: [{ type: ArgumentType.LITERAL, value: 24, isInteger: true }],
		});
	});

	it('throws UNDECLARED_IDENTIFIER for push with &name when memory does not exist', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('&missing')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws UNDEFINED_FUNCTION for call with an undeclared function target', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {}, functions: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('missingFn')],
		};

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDEFINED_FUNCTION}`);
	});

	it('does not throw for call when functions registry is undefined (prepass context)', () => {
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('anyFn')],
		};

		expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
	});

	it('does not throw for call when the target function is registered', () => {
		const context = {
			namespace: {
				memory: {},
				consts: {},
				moduleName: 'test',
				namespaces: {},
				functions: {
					knownFn: { id: 'knownFn', signature: { parameters: [], returns: [] }, body: [], locals: [] },
				},
			},
			locals: {},
		} as unknown as CompilationContext;
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('knownFn')],
		};

		expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
	});
});
