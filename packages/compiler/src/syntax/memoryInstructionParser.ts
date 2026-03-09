import { ArgumentType, type Argument, type ArgumentLiteral } from './parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from './syntaxError';
import hasMemoryReferencePrefix from './hasMemoryReferencePrefix';
import hasElementCountPrefix from './hasElementCountPrefix';
import extractMemoryReferenceBase from './extractMemoryReferenceBase';
import extractElementCountBase from './extractElementCountBase';
import isIntermodularReference from './isIntermodularReference';
import isIntermodularElementCountReference from './isIntermodularElementCountReference';
import extractIntermodularElementCountBase from './extractIntermodularElementCountBase';
import isIntermodularElementWordSizeReference from './isIntermodularElementWordSizeReference';
import extractIntermodularElementWordSizeBase from './extractIntermodularElementWordSizeBase';
import isIntermodularElementMaxReference from './isIntermodularElementMaxReference';
import extractIntermodularElementMaxBase from './extractIntermodularElementMaxBase';
import isIntermodularElementMinReference from './isIntermodularElementMinReference';
import extractIntermodularElementMinBase from './extractIntermodularElementMinBase';

export type MemoryArgumentShape =
	| { type: 'literal'; value: number }
	| { type: 'identifier'; value: string }
	| { type: 'split-byte-literal'; bytes: number[] }
	| { type: 'memory-reference'; base: string; pattern: string }
	| { type: 'element-count'; base: string }
	| { type: 'intermodular-reference'; pattern: string }
	| { type: 'intermodular-element-count'; module: string; memory: string; pattern: string }
	| { type: 'intermodular-element-word-size'; module: string; memory: string; pattern: string }
	| { type: 'intermodular-element-max'; module: string; memory: string; pattern: string }
	| { type: 'intermodular-element-min'; module: string; memory: string; pattern: string };

export interface ParsedMemoryInstructionArguments {
	firstArg: MemoryArgumentShape;
	secondArg?: MemoryArgumentShape;
}

/**
 * Returns true when the argument is a byte-sized integer literal (0–255) in any numeric form
 * (decimal, hexadecimal, or binary).
 */
function isByteLiteral(arg: Argument): arg is ArgumentLiteral & { type: ArgumentType.LITERAL; isInteger: true } {
	return arg.type === ArgumentType.LITERAL && arg.isInteger === true && arg.value >= 0 && arg.value <= 255;
}

/**
 * Parses memory instruction arguments at the syntax level.
 * This function classifies argument shapes without touching compiler state or performing semantic validation.
 *
 * @param args - Array of parsed arguments
 * @returns Parsed memory instruction arguments with shape information
 * @throws {SyntaxRulesError} If required arguments are missing
 */
export function parseMemoryInstructionArgumentsShape(args: Array<Argument>): ParsedMemoryInstructionArguments {
	if (!args[0]) {
		throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT);
	}

	const result: ParsedMemoryInstructionArguments = {
		firstArg: classifyArgument(args[0]),
	};

	// For named declarations (firstArg is identifier), check args[1..] for split bytes
	if (result.firstArg.type === 'identifier' && args[1]) {
		if (isByteLiteral(args[1])) {
			// Check if there are more byte literals (making this a split-byte sequence)
			const bytes: number[] = [args[1].value];
			let i = 2;
			while (args[i]) {
				if (isByteLiteral(args[i])) {
					bytes.push((args[i] as ArgumentLiteral).value);
					i++;
				} else {
					// Non-byte token after byte(s): invalid in split-byte context
					throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
				}
			}
			if (bytes.length >= 2) {
				result.secondArg = { type: 'split-byte-literal', bytes };
			} else {
				// Single byte literal — keep as regular literal (existing behaviour)
				result.secondArg = classifyArgument(args[1]);
			}
		} else {
			result.secondArg = classifyArgument(args[1]);
			// Reject unexpected extra arguments after a non-byte second arg
			if (args[2]) {
				throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
			}
		}
		return result;
	}

	// For anonymous declarations (firstArg is literal), check if it starts a split-byte sequence
	if (result.firstArg.type === 'literal' && args[1]) {
		if (isByteLiteral(args[0])) {
			if (isByteLiteral(args[1])) {
				const bytes: number[] = [(args[0] as ArgumentLiteral).value, args[1].value];
				let i = 2;
				while (args[i]) {
					if (isByteLiteral(args[i])) {
						bytes.push((args[i] as ArgumentLiteral).value);
						i++;
					} else {
						throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
					}
				}
				result.firstArg = { type: 'split-byte-literal', bytes };
				return result;
			} else {
				// Non-byte token after a leading byte literal: invalid in split-byte context
				throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
			}
		} else {
			// args[0] is out-of-byte-range literal with extra arguments: reject to avoid silent miscompilation
			throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
		}
	}

	if (args[1]) {
		result.secondArg = classifyArgument(args[1]);
	}

	return result;
}

function classifyArgument(arg: Argument): MemoryArgumentShape {
	if (arg.type === ArgumentType.LITERAL) {
		return {
			type: 'literal',
			value: arg.value,
		};
	}

	// Check for intermodular reference pattern (e.g., "&module.identifier")
	if (isIntermodularReference(arg.value)) {
		return {
			type: 'intermodular-reference',
			pattern: arg.value,
		};
	}

	// Check for intermodular element count reference pattern (e.g., "$module.memory")
	if (isIntermodularElementCountReference(arg.value)) {
		const { module, memory } = extractIntermodularElementCountBase(arg.value);
		return {
			type: 'intermodular-element-count',
			module,
			memory,
			pattern: arg.value,
		};
	}

	// Check for intermodular element word size reference pattern (e.g., "%module.memory")
	if (isIntermodularElementWordSizeReference(arg.value)) {
		const { module, memory } = extractIntermodularElementWordSizeBase(arg.value);
		return {
			type: 'intermodular-element-word-size',
			module,
			memory,
			pattern: arg.value,
		};
	}

	// Check for intermodular element max reference pattern (e.g., "^module.memory")
	if (isIntermodularElementMaxReference(arg.value)) {
		const { module, memory } = extractIntermodularElementMaxBase(arg.value);
		return {
			type: 'intermodular-element-max',
			module,
			memory,
			pattern: arg.value,
		};
	}

	// Check for intermodular element min reference pattern (e.g., "!module.memory")
	if (isIntermodularElementMinReference(arg.value)) {
		const { module, memory } = extractIntermodularElementMinBase(arg.value);
		return {
			type: 'intermodular-element-min',
			module,
			memory,
			pattern: arg.value,
		};
	}

	// Check for memory reference prefix
	if (hasMemoryReferencePrefix(arg.value)) {
		return {
			type: 'memory-reference',
			base: extractMemoryReferenceBase(arg.value),
			pattern: arg.value,
		};
	}

	// Check for element count prefix
	if (hasElementCountPrefix(arg.value)) {
		return {
			type: 'element-count',
			base: extractElementCountBase(arg.value),
		};
	}

	// Plain identifier
	return {
		type: 'identifier',
		value: arg.value,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseMemoryInstructionArgumentsShape', () => {
		it('throws when first argument is missing', () => {
			expect(() => parseMemoryInstructionArgumentsShape([])).toThrow(SyntaxRulesError);
		});

		it('parses literal argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.LITERAL, value: 3, isInteger: true }]);
			expect(result.firstArg).toEqual({ type: 'literal', value: 3 });
		});

		it('parses intermodular reference argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: '&mod.id' }]);
			expect(result.firstArg).toEqual({ type: 'intermodular-reference', pattern: '&mod.id' });
		});

		it('parses intermodular element count argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: '$mod.buffer' }]);
			expect(result.firstArg).toEqual({
				type: 'intermodular-element-count',
				module: 'mod',
				memory: 'buffer',
				pattern: '$mod.buffer',
			});
		});

		it('parses intermodular element word size argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: '%mod.buffer' }]);
			expect(result.firstArg).toEqual({
				type: 'intermodular-element-word-size',
				module: 'mod',
				memory: 'buffer',
				pattern: '%mod.buffer',
			});
		});

		it('parses intermodular element max argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: '^mod.buffer' }]);
			expect(result.firstArg).toEqual({
				type: 'intermodular-element-max',
				module: 'mod',
				memory: 'buffer',
				pattern: '^mod.buffer',
			});
		});

		it('parses intermodular element min argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: '!mod.buffer' }]);
			expect(result.firstArg).toEqual({
				type: 'intermodular-element-min',
				module: 'mod',
				memory: 'buffer',
				pattern: '!mod.buffer',
			});
		});

		it('parses memory reference argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: '&foo' }]);
			expect(result.firstArg).toEqual({ type: 'memory-reference', base: 'foo', pattern: '&foo' });
		});

		it('parses element count argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: '$foo' }]);
			expect(result.firstArg).toEqual({ type: 'element-count', base: 'foo' });
		});

		it('parses identifier argument', () => {
			const result = parseMemoryInstructionArgumentsShape([{ type: ArgumentType.IDENTIFIER, value: 'foo' }]);
			expect(result.firstArg).toEqual({ type: 'identifier', value: 'foo' });
		});

		it('parses second argument when provided', () => {
			const result = parseMemoryInstructionArgumentsShape([
				{ type: ArgumentType.IDENTIFIER, value: 'foo' },
				{ type: ArgumentType.LITERAL, value: 7, isInteger: true },
			]);
			expect(result.secondArg).toEqual({ type: 'literal', value: 7 });
		});
	});
}
