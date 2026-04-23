import { describe, expect, it } from 'vitest';

import { ArgumentType, classifyIdentifier } from './parseArgument';
import { SyntaxRulesError } from './syntaxError';
import validateInstructionArguments from './validateInstructionArguments';

const { parseCompileTimeOperand } = await import('./parseArgument');

describe('validateInstructionArguments', () => {
	it('enforces missing arguments for known instruction arity', () => {
		expect(() => validateInstructionArguments('push', [])).toThrowError(SyntaxRulesError);
		expect(() =>
			validateInstructionArguments('map', [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }])
		).toThrowError(SyntaxRulesError);
	});

	it('accepts compile-time values for default', () => {
		expect(() =>
			validateInstructionArguments('default', [
				{
					type: ArgumentType.COMPILE_TIME_EXPRESSION,
					left: parseCompileTimeOperand('SIZE'),
					operator: '*',
					right: parseCompileTimeOperand('2'),
					intermoduleIds: [],
				},
			])
		).not.toThrow();
	});

	it('rejects non-single-character string literals in map', () => {
		expect(() =>
			validateInstructionArguments('map', [
				{ type: ArgumentType.STRING_LITERAL, value: 'AB' },
				{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
			])
		).toThrowError(SyntaxRulesError);
	});

	it('rejects unsupported type identifiers', () => {
		expect(() =>
			validateInstructionArguments('param', [classifyIdentifier('bool'), classifyIdentifier('x')])
		).toThrowError(SyntaxRulesError);
	});

	it('accepts pointer type identifiers for params, locals, and functionEnd', () => {
		expect(() =>
			validateInstructionArguments('param', [classifyIdentifier('float*'), classifyIdentifier('buffer')])
		).not.toThrow();
		expect(() =>
			validateInstructionArguments('local', [classifyIdentifier('int16**'), classifyIdentifier('cursor')])
		).not.toThrow();
		expect(() => validateInstructionArguments('functionEnd', [classifyIdentifier('float64*')])).not.toThrow();
	});

	it('still rejects pointer type identifiers where only scalar types are valid', () => {
		expect(() => validateInstructionArguments('mapBegin', [classifyIdentifier('float*')])).toThrowError(
			SyntaxRulesError
		);
	});

	it('accepts bare #impure and rejects any arguments', () => {
		expect(() => validateInstructionArguments('#impure', [])).not.toThrow();
		expect(() => validateInstructionArguments('#impure', [classifyIdentifier('x')])).toThrowError(SyntaxRulesError);
	});

	it('accepts bare exitIfTrue and rejects any arguments', () => {
		expect(() => validateInstructionArguments('exitIfTrue', [])).not.toThrow();
		expect(() => validateInstructionArguments('exitIfTrue', [classifyIdentifier('x')])).toThrowError(SyntaxRulesError);
	});

	it('rejects too many result types for ifEnd', () => {
		expect(() =>
			validateInstructionArguments('ifEnd', [classifyIdentifier('int'), classifyIdentifier('float')])
		).toThrowError(SyntaxRulesError);
	});

	it('rejects non-constant identifiers for const declarations', () => {
		expect(() =>
			validateInstructionArguments('const', [
				classifyIdentifier('foo'),
				{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
			])
		).toThrowError(SyntaxRulesError);
	});

	it('validates array declaration argument shapes', () => {
		expect(() =>
			validateInstructionArguments('int[]', [
				classifyIdentifier('values'),
				{ type: ArgumentType.LITERAL, value: 8, isInteger: true },
			])
		).not.toThrow();
	});

	it('rejects any argument for block', () => {
		expect(() => validateInstructionArguments('block', [classifyIdentifier('int')])).toThrowError(SyntaxRulesError);
		expect(() => validateInstructionArguments('block', [classifyIdentifier('float')])).toThrowError(SyntaxRulesError);
		expect(() => validateInstructionArguments('block', [classifyIdentifier('void')])).toThrowError(SyntaxRulesError);
		expect(() =>
			validateInstructionArguments('block', [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }])
		).toThrowError(SyntaxRulesError);
	});

	it('accepts bare blockEnd', () => {
		expect(() => validateInstructionArguments('blockEnd', [])).not.toThrow();
	});

	it('accepts blockEnd with int or float', () => {
		expect(() => validateInstructionArguments('blockEnd', [classifyIdentifier('int')])).not.toThrow();
		expect(() => validateInstructionArguments('blockEnd', [classifyIdentifier('float')])).not.toThrow();
	});

	it('rejects blockEnd with invalid type identifiers', () => {
		expect(() => validateInstructionArguments('blockEnd', [classifyIdentifier('void')])).toThrowError(SyntaxRulesError);
		expect(() => validateInstructionArguments('blockEnd', [classifyIdentifier('bool')])).toThrowError(SyntaxRulesError);
		expect(() => validateInstructionArguments('blockEnd', [classifyIdentifier('string')])).toThrowError(
			SyntaxRulesError
		);
	});

	it('rejects too many result types for blockEnd', () => {
		expect(() =>
			validateInstructionArguments('blockEnd', [classifyIdentifier('int'), classifyIdentifier('float')])
		).toThrowError(SyntaxRulesError);
	});
});
