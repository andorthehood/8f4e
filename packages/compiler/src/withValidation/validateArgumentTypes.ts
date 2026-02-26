import { validateArgumentByRule } from './validateArgumentByRule';

import { ArgumentType, type CompilationContext, type InstructionCompiler } from '../types';

import type { ArgumentRule } from './types';

export function validateArgumentTypes(
	argumentsList: Parameters<InstructionCompiler>[0]['arguments'],
	rules: ArgumentRule[] | ArgumentRule,
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext
): void {
	if (Array.isArray(rules)) {
		for (let i = 0; i < rules.length; i++) {
			const argument = argumentsList[i];
			if (!argument) {
				return;
			}
			validateArgumentByRule(argument, rules[i], line, context);
		}
		return;
	}

	for (const argument of argumentsList) {
		validateArgumentByRule(argument, rules, line, context);
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const line: Parameters<InstructionCompiler>[0] = {
		lineNumber: 1,
		instruction: 'test' as never,
		arguments: [],
	};
	const context = { stack: [] } as unknown as CompilationContext;

	describe('validateArgumentTypes', () => {
		it('validates argument tuples', () => {
			expect(() =>
				validateArgumentTypes(
					[
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
						{ type: ArgumentType.IDENTIFIER, value: 'x' },
					],
					['literal', 'identifier'],
					line,
					context
				)
			).not.toThrow();
		});

		it('stops gracefully when tuple has fewer arguments than rules', () => {
			expect(() =>
				validateArgumentTypes(
					[{ type: ArgumentType.LITERAL, value: 1, isInteger: true }],
					['literal', 'identifier'],
					line,
					context
				)
			).not.toThrow();
		});

		it('validates all arguments for scalar rules', () => {
			expect(() =>
				validateArgumentTypes(
					[
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
						{ type: ArgumentType.IDENTIFIER, value: 'x' },
					],
					'literal',
					line,
					context
				)
			).toThrow();
		});
	});
}
