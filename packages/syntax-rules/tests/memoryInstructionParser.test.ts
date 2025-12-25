import { describe, it, expect } from 'vitest';

import { parseMemoryInstructionArgumentsShape } from '../src/memoryInstructionParser';
import { ArgumentType } from '../src/parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from '../src/syntaxError';

describe('parseMemoryInstructionArgumentsShape', () => {
	it('throws error when first argument is missing', () => {
		expect(() => parseMemoryInstructionArgumentsShape([])).toThrow(SyntaxRulesError);

		try {
			parseMemoryInstructionArgumentsShape([]);
		} catch (error) {
			expect(error).toBeInstanceOf(SyntaxRulesError);
			expect((error as SyntaxRulesError).code).toBe(SyntaxErrorCode.MISSING_ARGUMENT);
		}
	});

	it('parses literal first argument', () => {
		const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.LITERAL, value: 42, isInteger: true }]);

		expect(result.firstArg).toEqual({
			type: 'literal',
			value: 42,
		});
		expect(result.secondArg).toBeUndefined();
	});

	it('parses plain identifier first argument', () => {
		const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: 'myVar' }]);

		expect(result.firstArg).toEqual({
			type: 'identifier',
			value: 'myVar',
		});
	});

	it('parses memory reference with & prefix', () => {
		const result = parseMemoryInstructionArgumentsShape([
			{ type: ArgumentType.IDENTIFIER, value: 'counter' },
			{ type: ArgumentType.IDENTIFIER, value: '&myVar' },
		]);

		expect(result.secondArg).toEqual({
			type: 'memory-reference',
			base: 'myVar',
			pattern: '&myVar',
		});
	});

	it('parses memory reference with & suffix', () => {
		const result = parseMemoryInstructionArgumentsShape([
			{ type: ArgumentType.IDENTIFIER, value: 'counter' },
			{ type: ArgumentType.IDENTIFIER, value: 'myVar&' },
		]);

		expect(result.secondArg).toEqual({
			type: 'memory-reference',
			base: 'myVar',
			pattern: 'myVar&',
		});
	});

	it('parses element count reference', () => {
		const result = parseMemoryInstructionArgumentsShape([
			{ type: ArgumentType.IDENTIFIER, value: 'counter' },
			{ type: ArgumentType.IDENTIFIER, value: '$myArray' },
		]);

		expect(result.secondArg).toEqual({
			type: 'element-count',
			base: 'myArray',
		});
	});

	it('parses intermodular reference', () => {
		const result = parseMemoryInstructionArgumentsShape([
			{ type: ArgumentType.IDENTIFIER, value: 'counter' },
			{ type: ArgumentType.IDENTIFIER, value: '&module.identifier' },
		]);

		expect(result.secondArg).toEqual({
			type: 'intermodular-reference',
			pattern: '&module.identifier',
		});
	});

	it('parses literal second argument', () => {
		const result = parseMemoryInstructionArgumentsShape([
			{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
			{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
		]);

		expect(result.secondArg).toEqual({
			type: 'literal',
			value: 100,
		});
	});

	it('parses plain identifier second argument', () => {
		const result = parseMemoryInstructionArgumentsShape([
			{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
			{ type: ArgumentType.IDENTIFIER, value: 'myConst' },
		]);

		expect(result.secondArg).toEqual({
			type: 'identifier',
			value: 'myConst',
		});
	});
});
