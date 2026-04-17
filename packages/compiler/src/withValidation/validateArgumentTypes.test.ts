import { describe, expect, it } from 'vitest';

import { validateArgumentTypes } from './validateArgumentTypes';

import { ArgumentType, type CompilationContext, type InstructionCompiler } from '../types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

const line: Parameters<InstructionCompiler>[0] = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'test' as never,
	arguments: [],
};
const context = { stack: [] } as unknown as CompilationContext;

describe('validateArgumentTypes', () => {
	it('validates argument tuples', () => {
		expect(() =>
			validateArgumentTypes(
				[{ type: ArgumentType.LITERAL, value: 1, isInteger: true }, classifyIdentifier('x')],
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
				[{ type: ArgumentType.LITERAL, value: 1, isInteger: true }, classifyIdentifier('x')],
				'literal',
				line,
				context
			)
		).toThrow();
	});
});
