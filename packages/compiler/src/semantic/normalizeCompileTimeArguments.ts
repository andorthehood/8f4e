import { tryResolveCompileTimeArgument } from './resolveCompileTimeArgument';
import { isMemoryDeclarationInstruction } from './declarations';

import { ArgumentType, type AST, type Argument, type CompilationContext } from '../types';
import { ErrorCode, getError } from '../compilerError';

function normalizeArgument(argument: Argument, context: CompilationContext): Argument {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved =
		argument.type === ArgumentType.IDENTIFIER || argument.type === ArgumentType.COMPILE_TIME_EXPRESSION
			? tryResolveCompileTimeArgument(context.namespace, argument)
			: undefined;

	if (!resolved) {
		return argument;
	}

	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
	};
}

export default function normalizeCompileTimeArguments(line: AST[number], context: CompilationContext): AST[number] {
	let argumentIndexesToNormalize: number[] = [];

	switch (line.instruction) {
		case 'const':
			argumentIndexesToNormalize = [1];
			break;
		case 'push':
			argumentIndexesToNormalize = [0];
			break;
		case 'default':
			argumentIndexesToNormalize = [0];
			break;
		case 'init':
			argumentIndexesToNormalize = [1];
			break;
		case 'map':
			argumentIndexesToNormalize = [0, 1];
			break;
		default:
			if (isMemoryDeclarationInstruction(line.instruction)) {
				argumentIndexesToNormalize = [0, 1];
			}
			break;
	}

	if (argumentIndexesToNormalize.length === 0) {
		return line;
	}

	let changed = false;
	const nextArguments = line.arguments.map((argument, index) => {
		if (!argumentIndexesToNormalize.includes(index)) {
			return argument;
		}

		const normalized = normalizeArgument(argument, context);
		if (normalized !== argument) {
			changed = true;
		}
		return normalized;
	});

	for (const index of argumentIndexesToNormalize) {
		const argument = nextArguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${argument.lhs}${argument.operator}${argument.rhs}`,
			});
		}
		if ((line.instruction === 'map' || line.instruction === 'default') && argument?.type === ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
		}
	}

	return changed ? { ...line, arguments: nextArguments } : line;
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

			expect(() => normalizeCompileTimeArguments(line, context)).toThrow();
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

			expect(() => normalizeCompileTimeArguments(line, context)).toThrow();
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

			expect(() => normalizeCompileTimeArguments(line, context)).toThrow();
		});

		it('leaves push identifier arguments unchanged when unresolvable (may be a local)', () => {
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
				locals: {},
			} as unknown as CompilationContext;

			expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
		});
	});
}
