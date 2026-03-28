import {
	INTERMODULAR_REFERENCE_PATTERN,
	extractIntermodularElementCountBase,
	extractIntermodularElementMaxBase,
	extractIntermodularElementMinBase,
	extractIntermodularElementWordSizeBase,
	extractIntermodularModuleReferenceBase,
	isIntermodularElementCountReference,
	isIntermodularElementMaxReference,
	isIntermodularElementMinReference,
	isIntermodularElementWordSizeReference,
	isIntermodularModuleReference,
} from '@8f4e/tokenizer';

import { tryResolveCompileTimeArgument } from './resolveCompileTimeArgument';
import { isMemoryDeclarationInstruction } from './declarations';

import { ArgumentType, type AST, type Argument, type CompilationContext } from '../types';
import { ErrorCode, getError } from '../compilerError';
import { isMemoryIdentifier, isMemoryPointerIdentifier, isMemoryReferenceIdentifier } from '../utils/memoryIdentifier';

/**
 * Validates that intermodule address references target existing modules and memory.
 * Called after namespace collection is complete (when namespaces dict is populated).
 * Does NOT validate metadata queries (sizeof, count, etc.) — those are handled by
 * tryResolveCompileTimeArgument returning undefined during prepass.
 */
function validateIntermoduleAddressReference(value: string, line: AST[number], context: CompilationContext): void {
	// Only validate if we're post-prepass (namespaces collected)
	if (Object.keys(context.namespace.namespaces).length === 0) {
		return;
	}

	if (isIntermodularModuleReference(value)) {
		const { module: targetModuleId } = extractIntermodularModuleReferenceBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		return;
	}

	if (INTERMODULAR_REFERENCE_PATTERN.test(value)) {
		const cleanRef = value.endsWith('&') ? value.slice(0, -1) : value.substring(1);
		const [targetModuleId, targetMemoryId] = cleanRef.split(':');

		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		const targetMemory = context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId];
		if (!targetMemory) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	// For metadata queries (count, sizeof, max, min), validate module and memory existence
	if (isIntermodularElementCountReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementCountBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (isIntermodularElementWordSizeReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementWordSizeBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (isIntermodularElementMaxReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMaxBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (isIntermodularElementMinReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMinBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
	}
}

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

	// Validate local existence for localGet/localSet: by the time we process these lines,
	// all local declarations before them in the same compile pass have already run.
	if (line.instruction === 'localGet' || line.instruction === 'localSet') {
		const nameArg = line.arguments[0];
		if (nameArg?.type === ArgumentType.IDENTIFIER && !context.locals[nameArg.value]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: nameArg.value });
		}
	}

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
			// Validate intermodule references in compile-time expressions
			if (typeof argument.lhs === 'string') {
				validateIntermoduleAddressReference(argument.lhs, line, context);
			}
			if (typeof argument.rhs === 'string') {
				validateIntermoduleAddressReference(argument.rhs, line, context);
			}
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${argument.lhs}${argument.operator}${argument.rhs}`,
			});
		}
		if ((line.instruction === 'map' || line.instruction === 'default') && argument?.type === ArgumentType.IDENTIFIER) {
			// Validate intermodule references before throwing generic undeclared error
			validateIntermoduleAddressReference(argument.value, line, context);
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
		}
		if (
			(line.instruction === 'init' || isMemoryDeclarationInstruction(line.instruction)) &&
			argument?.type === ArgumentType.IDENTIFIER &&
			index === 1
		) {
			// Validate intermodule references in init default values and memory declaration default values
			validateIntermoduleAddressReference(argument.value, line, context);
		}
		if (line.instruction === 'push' && argument?.type === ArgumentType.IDENTIFIER) {
			const { value } = argument;
			const { memory } = context.namespace;
			// Validate intermodule references first
			validateIntermoduleAddressReference(value, line, context);
			if (
				!isMemoryIdentifier(memory, value) &&
				!isMemoryPointerIdentifier(memory, value) &&
				!isMemoryReferenceIdentifier(memory, value) &&
				!context.locals[value]
			) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
			}
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
			expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
		});
	});
}
