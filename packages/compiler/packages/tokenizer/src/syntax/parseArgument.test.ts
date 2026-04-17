import { describe, expect, it } from 'vitest';

import { ArgumentType, classifyIdentifier, decodeStringLiteral, parseArgument } from './parseArgument';

/**
 * Ordering regression tests for classifyIdentifier.
 *
 * The if-chain in classifyIdentifier is order-dependent. These tests assert the
 * correct referenceKind for tokens that would be misclassified if the order were violated:
 *
 * 1. intermodular-module-reference (&mod:) before intermodular-reference (&mod:mem)
 *    — &mod: would match isIntermodularReference if checked first (the memory
 *      name part would be empty, but the module-base form must win).
 * 2. intermodular-module-nth-reference (&mod:0) before intermodular-reference (&mod:mem)
 *    — digits are valid [^\s&:.] characters, so &mod:0 silently classifies as a
 *      named memory reference if the nth check comes second.
 * 3. All intermodular forms before the local memory-reference check (&name)
 *    — both start with & so &mod:mem would fall through to memory-reference
 *      if the intermodular check were removed.
 */
describe('classifyIdentifier – check ordering regression', () => {
	describe('&mod: → intermodular-module-reference, not intermodular-reference', () => {
		it('classifies &mod: as intermodular-module-reference', () => {
			expect(classifyIdentifier('&mod:').referenceKind).toBe('intermodular-module-reference');
		});

		it('classifies module:& as intermodular-module-reference', () => {
			expect(classifyIdentifier('module:&').referenceKind).toBe('intermodular-module-reference');
		});
	});

	describe('&mod:0 → intermodular-module-nth-reference, not intermodular-reference', () => {
		it('classifies &mod:0 as intermodular-module-nth-reference', () => {
			expect(classifyIdentifier('&mod:0').referenceKind).toBe('intermodular-module-nth-reference');
		});

		it('classifies &mod:1 as intermodular-module-nth-reference', () => {
			expect(classifyIdentifier('&mod:1').referenceKind).toBe('intermodular-module-nth-reference');
		});

		it('classifies &mod:10 as intermodular-module-nth-reference', () => {
			expect(classifyIdentifier('&mod:10').referenceKind).toBe('intermodular-module-nth-reference');
		});
	});

	describe('&mod:mem → intermodular-reference, not memory-reference', () => {
		it('classifies &mod:mem as intermodular-reference', () => {
			expect(classifyIdentifier('&mod:mem').referenceKind).toBe('intermodular-reference');
		});

		it('classifies mod:mem& as intermodular-reference', () => {
			expect(classifyIdentifier('mod:mem&').referenceKind).toBe('intermodular-reference');
		});
	});

	describe('&name → memory-reference, not any intermodular form', () => {
		it('classifies &name as memory-reference', () => {
			const result = classifyIdentifier('&name');
			expect(result.referenceKind).toBe('memory-reference');
			expect(result.scope).toBe('local');
		});

		it('classifies name& as memory-reference', () => {
			const result = classifyIdentifier('name&');
			expect(result.referenceKind).toBe('memory-reference');
			expect(result.scope).toBe('local');
		});
	});
});

describe('parseArgument', () => {
	it('parses decimal integers', () => {
		expect(parseArgument('42')).toEqual({
			value: 42,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
		expect(parseArgument('-7')).toEqual({
			value: -7,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
	});

	it('parses decimal floats', () => {
		expect(parseArgument('3.14')).toEqual({
			value: 3.14,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
	});

	it('parses non-f64 scientific notation literals', () => {
		// Scientific notation is treated as float-typed syntax even when the numeric value is integral.
		expect(parseArgument('1e3')).toEqual({
			value: 1000,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
		expect(parseArgument('1e-3')).toEqual({
			value: 0.001,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
		expect(parseArgument('-2.5e4')).toEqual({
			value: -25000,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
	});

	it('parses hex integers', () => {
		expect(parseArgument('0x10')).toEqual({
			value: 16,
			type: ArgumentType.LITERAL,
			isInteger: true,
			isHex: true,
		});
	});

	it('parses binary integers', () => {
		expect(parseArgument('0b101')).toEqual({
			value: 5,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
	});

	it('parses identifiers', () => {
		expect(parseArgument('value')).toEqual({
			value: 'value',
			type: ArgumentType.IDENTIFIER,
			referenceKind: 'plain',
			scope: 'local',
		});
	});

	it('rejects identifiers that start with numbers', () => {
		expect(() => parseArgument('1abc')).toThrow('Identifiers cannot start with numbers');
		expect(() => parseArgument('123ABC')).toThrow('Identifiers cannot start with numbers');
	});

	it('rejects invalid numeric literals or expressions', () => {
		expect(() => parseArgument('1e')).toThrow('Invalid numeric literal or expression');
		expect(() => parseArgument('1e+')).toThrow('Invalid numeric literal or expression');
		expect(() => parseArgument('0xZZ')).toThrow('Invalid numeric literal or expression');
	});

	it('parses fraction literals with float result', () => {
		expect(parseArgument('1/16')).toEqual({
			value: 0.0625,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
		expect(parseArgument('-1/2')).toEqual({
			value: -0.5,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
	});

	it('parses fraction literals with integer result', () => {
		expect(parseArgument('8/2')).toEqual({
			value: 4,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
		expect(parseArgument('16/4')).toEqual({
			value: 4,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
	});

	it('throws error on division by zero in fraction literals', () => {
		expect(() => parseArgument('8/0')).toThrow('Division by zero');
		expect(() => parseArgument('1/0')).toThrow('Division by zero');
	});

	it('parses negative denominators as literal expressions', () => {
		expect(parseArgument('1/-2')).toEqual({
			value: -0.5,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
	});

	it('folds literal-only multiplication', () => {
		expect(parseArgument('16*2')).toEqual({
			value: 32,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
		expect(parseArgument('3.5*4')).toEqual({
			value: 14,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
		expect(parseArgument('3.5*0.5')).toEqual({
			value: 1.75,
			type: ArgumentType.LITERAL,
			isInteger: false,
		});
	});

	it('folds hex literal in mul/div expression', () => {
		expect(parseArgument('0x10/2')).toEqual({
			value: 8,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
		expect(parseArgument('0x10*2')).toEqual({
			value: 32,
			type: ArgumentType.LITERAL,
			isInteger: true,
		});
	});

	it('folds f64-suffixed literal in mul/div expression', () => {
		expect(parseArgument('3f64*2')).toEqual({
			value: 6,
			type: ArgumentType.LITERAL,
			isInteger: false,
			isFloat64: true,
		});
	});

	it('rejects chained or mixed numeric-looking operators', () => {
		expect(() => parseArgument('2*3*4')).toThrow('Invalid numeric literal or expression');
		expect(() => parseArgument('2*3/4')).toThrow('Invalid numeric literal or expression');
	});

	it('parses compile-time expressions as dedicated AST nodes', () => {
		expect(parseArgument('123*sizeof(name)')).toEqual({
			type: ArgumentType.COMPILE_TIME_EXPRESSION,
			left: { type: ArgumentType.LITERAL, value: 123, isInteger: true },
			operator: '*',
			right: {
				type: ArgumentType.IDENTIFIER,
				value: 'sizeof(name)',
				referenceKind: 'element-word-size',
				scope: 'local',
				targetMemoryId: 'name',
			},
			intermoduleIds: [],
		});
		expect(parseArgument('2*SIZE')).toEqual({
			type: ArgumentType.COMPILE_TIME_EXPRESSION,
			left: { type: ArgumentType.LITERAL, value: 2, isInteger: true },
			operator: '*',
			right: {
				type: ArgumentType.IDENTIFIER,
				value: 'SIZE',
				referenceKind: 'constant',
				scope: 'local',
			},
			intermoduleIds: [],
		});
		expect(parseArgument('SIZE*sizeof(name)')).toEqual({
			type: ArgumentType.COMPILE_TIME_EXPRESSION,
			left: {
				type: ArgumentType.IDENTIFIER,
				value: 'SIZE',
				referenceKind: 'constant',
				scope: 'local',
			},
			operator: '*',
			right: {
				type: ArgumentType.IDENTIFIER,
				value: 'sizeof(name)',
				referenceKind: 'element-word-size',
				scope: 'local',
				targetMemoryId: 'name',
			},
			intermoduleIds: [],
		});
	});

	it('populates intermoduleIds for intermodular operands', () => {
		expect(parseArgument('2*sizeof(source:buffer)')).toEqual({
			type: ArgumentType.COMPILE_TIME_EXPRESSION,
			left: { type: ArgumentType.LITERAL, value: 2, isInteger: true },
			operator: '*',
			right: {
				type: ArgumentType.IDENTIFIER,
				value: 'sizeof(source:buffer)',
				referenceKind: 'intermodular-element-word-size',
				scope: 'intermodule',
				targetModuleId: 'source',
				targetMemoryId: 'buffer',
			},
			intermoduleIds: ['source'],
		});
	});

	it('parses f64-suffixed float literals', () => {
		expect(parseArgument('3.14f64')).toEqual({
			value: 3.14,
			type: ArgumentType.LITERAL,
			isInteger: false,
			isFloat64: true,
		});
		expect(parseArgument('-42.0f64')).toEqual({
			value: -42.0,
			type: ArgumentType.LITERAL,
			isInteger: false,
			isFloat64: true,
		});
		expect(parseArgument('0.5f64')).toEqual({
			value: 0.5,
			type: ArgumentType.LITERAL,
			isInteger: false,
			isFloat64: true,
		});
	});

	it('parses f64-suffixed integer-valued literals as float64', () => {
		expect(parseArgument('3f64')).toEqual({
			value: 3,
			type: ArgumentType.LITERAL,
			isInteger: false,
			isFloat64: true,
		});
	});

	it('parses f64-suffixed scientific notation literals', () => {
		expect(parseArgument('1e-10f64')).toEqual({
			value: 1e-10,
			type: ArgumentType.LITERAL,
			isInteger: false,
			isFloat64: true,
		});
		expect(parseArgument('1.5e10f64')).toEqual({
			value: 1.5e10,
			type: ArgumentType.LITERAL,
			isInteger: false,
			isFloat64: true,
		});
	});

	it('rejects non-finite scientific notation literals', () => {
		expect(() => parseArgument('1e309')).toThrow('Invalid numeric literal');
		expect(() => parseArgument('1e309f64')).toThrow('Invalid numeric literal');
		expect(() => parseArgument('1e309*2')).toThrow('Invalid numeric literal or expression');
		expect(() => parseArgument('1e309f64*2')).toThrow('Invalid numeric literal or expression');
	});

	it('does not parse malformed f64 suffix forms as f64 literals', () => {
		// F64 (uppercase) is not valid
		expect(() => parseArgument('3.14F64')).toThrow('Invalid numeric literal or expression');
		// double-f is not valid
		expect(() => parseArgument('3.14ff64')).toThrow('Invalid numeric literal or expression');
		// multiple dots are not valid
		expect(parseArgument('..f64').type).toBe(ArgumentType.IDENTIFIER);
	});

	describe('string literals', () => {
		it('parses a simple quoted string', () => {
			expect(parseArgument('"hello"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: 'hello',
			});
		});

		it('parses an empty string', () => {
			expect(parseArgument('""')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: '',
			});
		});

		it('decodes \\n escape', () => {
			expect(parseArgument('"a\\nb"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: 'a\nb',
			});
		});

		it('decodes \\r escape', () => {
			expect(parseArgument('"a\\rb"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: 'a\rb',
			});
		});

		it('decodes \\t escape', () => {
			expect(parseArgument('"a\\tb"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: 'a\tb',
			});
		});

		it('decodes \\\\ escape', () => {
			expect(parseArgument('"a\\\\b"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: 'a\\b',
			});
		});

		it('decodes \\" escape', () => {
			expect(parseArgument('"say \\"hi\\""')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: 'say "hi"',
			});
		});

		it('decodes \\xNN hex escape', () => {
			expect(parseArgument('"\\x41"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: 'A',
			});
			expect(parseArgument('"\\x00"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: '\x00',
			});
			expect(parseArgument('"\\xFF"')).toEqual({
				type: ArgumentType.STRING_LITERAL,
				value: '\xFF',
			});
		});

		it('throws on malformed \\x escape', () => {
			expect(() => parseArgument('"\\xGG"')).toThrow('Invalid hex escape sequence');
			expect(() => parseArgument('"\\x1"')).toThrow('Invalid hex escape sequence');
		});

		it('throws on unknown escape sequence', () => {
			expect(() => parseArgument('"\\z"')).toThrow('Unknown escape sequence');
		});

		it('throws on trailing backslash', () => {
			expect(() => decodeStringLiteral('abc\\')).toThrow('Unexpected end of string');
		});
	});
});
