import dispatchNormalization from './normalization';

import { ArgumentType, type AST, type CompilationContext } from '../types';
import { ErrorCode } from '../compilerError';

export default function normalizeCompileTimeArguments(line: AST[number], context: CompilationContext): AST[number] {
	return dispatchNormalization(line, context);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('normalizeCompileTimeArguments', () => {
		it('folds compile-time push expressions into literals', () => {
			const line: AST[number] = {
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [{ type: ArgumentType.COMPILE_TIME_EXPRESSION, lhs: '2', operator: '*', rhs: 'SIZE' }],
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: 'output' }],
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
				arguments: [
					{ type: ArgumentType.COMPILE_TIME_EXPRESSION, lhs: 'SIZE', operator: '/', rhs: '2' },
					{ type: ArgumentType.COMPILE_TIME_EXPRESSION, lhs: '2', operator: '*', rhs: 'SIZE' },
				],
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
				arguments: [{ type: ArgumentType.COMPILE_TIME_EXPRESSION, lhs: '2', operator: '*', rhs: 'MISSING' }],
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
				arguments: [
					{ type: ArgumentType.IDENTIFIER, value: 'MISSING_CONST' },
					{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
				],
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
				arguments: [
					{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
					{ type: ArgumentType.IDENTIFIER, value: 'UNRESOLVED' },
				],
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: 'MISSING_CONST' }],
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: 'localVar' }],
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: 'unknownVar' }],
			};

			expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
		});

		it('throws UNDECLARED_IDENTIFIER for localGet with an undeclared local', () => {
			const context = {
				namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
				locals: {},
			} as unknown as CompilationContext;
			const line: AST[number] = {
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'localGet',
				arguments: [{ type: ArgumentType.IDENTIFIER, value: 'missing' }],
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: 'missing' }],
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: '&otherModule:missingMemory' }],
			};

			expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
		});

		it('throws UNDECLARED_IDENTIFIER for init with undeclared intermodule module reference', () => {
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
				arguments: [
					{ type: ArgumentType.IDENTIFIER, value: 'target' },
					{ type: ArgumentType.IDENTIFIER, value: '&missingModule:' },
				],
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
				arguments: [
					{ type: ArgumentType.IDENTIFIER, value: 'buffer' },
					{ type: ArgumentType.IDENTIFIER, value: '&source:missingBuffer' },
				],
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: '&source:buffer' }],
			};

			// Should not throw - the identifier stays as-is because it's a valid intermodule reference
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: '&otherModule:buffer' }],
			};

			// Should not throw during prepass - validation is deferred
			expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
		});
	});
}
