import { tryResolveCompileTimeValueOrExpression } from './resolveConstantValue';

import { ArgumentType, type AST, type Argument, type CompilationContext } from '../types';

import type { Instruction } from '../instructionCompilers';

const declarationInstructions = new Set<Instruction>([
	'int',
	'float',
	'int*',
	'int**',
	'int16*',
	'int16**',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
	'float[]',
	'int[]',
	'int8[]',
	'int8u[]',
	'int16[]',
	'int16u[]',
	'int32[]',
	'float*[]',
	'float**[]',
	'int*[]',
	'int**[]',
	'float64[]',
	'float64*[]',
	'float64**[]',
]);

function normalizeArgument(argument: Argument, context: CompilationContext): Argument {
	if (argument.type !== ArgumentType.IDENTIFIER) {
		return argument;
	}

	const resolved = tryResolveCompileTimeValueOrExpression(context.namespace, argument.value);

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
		case 'skip':
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
			if (declarationInstructions.has(line.instruction)) {
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
				arguments: [{ type: ArgumentType.IDENTIFIER, value: '2*SIZE' }],
			};
			const context = {
				namespace: {
					memory: {},
					locals: {},
					consts: { SIZE: { value: 8, isInteger: true } },
					moduleName: 'test',
					namespaces: {},
				},
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
					locals: {},
					consts: {},
					moduleName: 'test',
					namespaces: {},
				},
			} as unknown as CompilationContext;

			expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
		});

		it('folds compile-time map arguments into literals', () => {
			const line: AST[number] = {
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'map',
				arguments: [
					{ type: ArgumentType.IDENTIFIER, value: 'SIZE/2' },
					{ type: ArgumentType.IDENTIFIER, value: '2*SIZE' },
				],
			};
			const context = {
				namespace: {
					memory: {},
					locals: {},
					consts: { SIZE: { value: 8, isInteger: true } },
					moduleName: 'test',
					namespaces: {},
				},
			} as unknown as CompilationContext;

			expect(normalizeCompileTimeArguments(line, context)).toEqual({
				...line,
				arguments: [
					{ type: ArgumentType.LITERAL, value: 4, isInteger: true },
					{ type: ArgumentType.LITERAL, value: 16, isInteger: true },
				],
			});
		});
	});
}
