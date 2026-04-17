import { describe, expect, it } from 'vitest';

import { ArgumentType, classifyIdentifier } from './parseArgument';
import { SyntaxRulesError } from './syntaxError';
import { parseMemoryInstructionArgumentsShape } from './memoryInstructionParser';

describe('parseMemoryInstructionArgumentsShape', () => {
	it('throws when first argument is missing', () => {
		expect(() => parseMemoryInstructionArgumentsShape([])).toThrow(SyntaxRulesError);
	});

	it('parses literal argument', () => {
		const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.LITERAL, value: 3, isInteger: true }]);
		expect(result.firstArg).toEqual({ type: 'literal', value: 3 });
	});

	it('parses intermodular reference argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('&mod:id')]);
		expect(result.firstArg).toEqual({
			type: 'intermodular-reference',
			pattern: '&mod:id',
		});
	});

	it('parses intermodular module-base reference argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('&mod:')]);
		expect(result.firstArg).toEqual({
			type: 'intermodular-module-reference',
			module: 'mod',
			pattern: '&mod:',
			isEndAddress: false,
		});
	});

	it('parses intermodular module-end reference argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('mod:&')]);
		expect(result.firstArg).toEqual({
			type: 'intermodular-module-reference',
			module: 'mod',
			pattern: 'mod:&',
			isEndAddress: true,
		});
	});

	it('parses intermodular element count argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('count(mod:buffer)')]);
		expect(result.firstArg).toEqual({
			type: 'intermodular-element-count',
			module: 'mod',
			memory: 'buffer',
			pattern: 'count(mod:buffer)',
		});
	});

	it('parses intermodular element word size argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('sizeof(mod:buffer)')]);
		expect(result.firstArg).toEqual({
			type: 'intermodular-element-word-size',
			module: 'mod',
			memory: 'buffer',
			pattern: 'sizeof(mod:buffer)',
		});
	});

	it('parses intermodular element max argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('max(mod:buffer)')]);
		expect(result.firstArg).toEqual({
			type: 'intermodular-element-max',
			module: 'mod',
			memory: 'buffer',
			pattern: 'max(mod:buffer)',
		});
	});

	it('parses intermodular element min argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('min(mod:buffer)')]);
		expect(result.firstArg).toEqual({
			type: 'intermodular-element-min',
			module: 'mod',
			memory: 'buffer',
			pattern: 'min(mod:buffer)',
		});
	});

	it('parses memory reference argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('&foo')]);
		expect(result.firstArg).toEqual({
			type: 'memory-reference',
			base: 'foo',
			pattern: '&foo',
		});
	});

	it('parses element count argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('count(foo)')]);
		expect(result.firstArg).toEqual({ type: 'element-count', base: 'foo' });
	});

	it('parses identifier argument', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('foo')]);
		expect(result.firstArg).toEqual({ type: 'identifier', value: 'foo' });
	});

	it('parses second argument when provided', () => {
		const result = parseMemoryInstructionArgumentsShape([
			classifyIdentifier('foo'),
			{ type: ArgumentType.LITERAL, value: 7, isInteger: true },
		]);
		expect(result.secondArg).toEqual({ type: 'literal', value: 7 });
	});

	it('parses constant-style identifier as anonymous (no second arg)', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('MY_CONST')]);
		expect(result.firstArg).toEqual({ type: 'identifier', value: 'MY_CONST' });
		expect(result.secondArg).toBeUndefined();
	});

	it('parses two constant-style identifiers as anonymous split-byte-tokens', () => {
		const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('HI'), classifyIdentifier('LO')]);
		expect(result.firstArg).toEqual({
			type: 'split-byte-tokens',
			tokens: [
				{ type: 'identifier', value: 'HI' },
				{ type: 'identifier', value: 'LO' },
			],
		});
		expect(result.secondArg).toBeUndefined();
	});

	it('parses named declaration with two constant identifiers as split-byte-tokens in secondArg', () => {
		const result = parseMemoryInstructionArgumentsShape([
			classifyIdentifier('foo'),
			classifyIdentifier('HI'),
			classifyIdentifier('LO'),
		]);
		expect(result.firstArg).toEqual({ type: 'identifier', value: 'foo' });
		expect(result.secondArg).toEqual({
			type: 'split-byte-tokens',
			tokens: [
				{ type: 'identifier', value: 'HI' },
				{ type: 'identifier', value: 'LO' },
			],
		});
	});

	it('parses named declaration with mixed byte literal and constant identifier as split-byte-tokens', () => {
		const result = parseMemoryInstructionArgumentsShape([
			classifyIdentifier('foo'),
			{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			classifyIdentifier('HI'),
		]);
		expect(result.secondArg).toEqual({
			type: 'split-byte-tokens',
			tokens: [
				{ type: 'literal', value: 0xa8 },
				{ type: 'identifier', value: 'HI' },
			],
		});
	});

	it('throws when constant-style identifier is followed by a special reference', () => {
		expect(() => parseMemoryInstructionArgumentsShape([classifyIdentifier('HI'), classifyIdentifier('&buf')])).toThrow(
			SyntaxRulesError
		);
	});
});
