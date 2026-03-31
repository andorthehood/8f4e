import { ArgumentType, classifyIdentifier, type Argument, type ArgumentLiteral } from './parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from './syntaxError';

/**
 * A single token within a split-byte sequence.
 * May be a resolved byte literal or an identifier to be resolved as a compile-time constant.
 */
export type SplitByteToken = { type: 'literal'; value: number } | { type: 'identifier'; value: string };

export type MemoryArgumentShape =
	| { type: 'literal'; value: number }
	| { type: 'identifier'; value: string }
	| { type: 'split-byte-tokens'; tokens: SplitByteToken[] }
	| { type: 'memory-reference'; base: string; pattern: string }
	| { type: 'element-count'; base: string }
	| { type: 'intermodular-reference'; pattern: string }
	| { type: 'intermodular-module-reference'; module: string; pattern: string; isEndAddress: boolean }
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
 * Returns true when the argument can participate in a split-byte sequence:
 * either a byte-sized integer literal (0–255) or a plain or constant-style identifier.
 * Plain and constant-style identifiers are expected to be resolved as compile-time constants
 * in the semantic phase.
 */
function isSplitByteCandidate(arg: Argument): boolean {
	if (isByteLiteral(arg)) return true;
	if (arg.type !== ArgumentType.IDENTIFIER) return false;
	// Only plain and constant-style identifiers are valid split-byte participants.
	// All other reference kinds (memory-reference, element-count, intermodular-*, etc.) are excluded.
	return arg.referenceKind === 'plain' || arg.referenceKind === 'constant';
}

/**
 * Converts an argument known to be a valid split-byte candidate into a SplitByteToken.
 */
function toSplitByteToken(arg: Argument): SplitByteToken {
	if (arg.type === ArgumentType.LITERAL) {
		return { type: 'literal', value: (arg as ArgumentLiteral).value };
	}
	return { type: 'identifier', value: (arg as { value: string }).value };
}

/**
 * Collects all arguments from position `start` onward as split-byte tokens.
 * Throws SPLIT_HEX_MIXED_TOKENS if any argument is not a valid split-byte candidate.
 */
function collectSplitByteTokens(args: Array<Argument>, start: number): SplitByteToken[] {
	const tokens: SplitByteToken[] = [];
	for (let i = start; i < args.length; i++) {
		if (!isSplitByteCandidate(args[i])) {
			throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
		}
		tokens.push(toSplitByteToken(args[i]));
	}
	return tokens;
}

/**
 * Parses memory instruction arguments at the syntax level.
 * This function classifies argument shapes without touching compiler state or performing semantic validation
 * (e.g., it does not look up constants or memory names). The one exception is the constant-style identifier
 * check (`isConstantName`), which is a pure naming-convention rule applied to token text alone and requires
 * no compiler state — it disambiguates anonymous declarations at the syntax level so that `int HI LO` is
 * always treated as an anonymous split-byte declaration and never as a named allocation.
 *
 * Split-byte detection rules:
 * - Two or more tokens that are byte literals or plain identifiers form a split-byte sequence (split-byte-tokens).
 * - Constant-style identifiers (all-uppercase, matching isConstantName) are treated as anonymous starts and
 *   cannot be used as memory names. When followed by more tokens, they start a split-byte sequence.
 * - Named declarations (non-constant-style identifier as first arg) collect 2+ following tokens as split-byte-tokens.
 * - A single token in any position is not treated as split-byte.
 *
 * @param args - Array of parsed arguments
 * @returns Parsed memory instruction arguments with shape information
 * @throws {SyntaxRulesError} If required arguments are missing or the token sequence is invalid
 */
export function parseMemoryInstructionArgumentsShape(args: Array<Argument>): ParsedMemoryInstructionArguments {
	if (!args[0]) {
		throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT);
	}

	const result: ParsedMemoryInstructionArguments = {
		firstArg: classifyArgument(args[0]),
	};

	// Case A: Anonymous path — starts with a byte-sized integer literal (0–255)
	if (result.firstArg.type === 'literal' && isByteLiteral(args[0])) {
		if (args[1]) {
			if (!isSplitByteCandidate(args[1])) {
				throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
			}
			// Two or more tokens: collect all as split-byte-tokens
			const tokens: SplitByteToken[] = [
				{ type: 'literal', value: (args[0] as ArgumentLiteral).value },
				...collectSplitByteTokens(args, 1),
			];
			result.firstArg = { type: 'split-byte-tokens', tokens };
		}
		return result;
	}

	// Case B: Anonymous path — out-of-range literal followed by extra args (reject to prevent silent miscompilation)
	if (result.firstArg.type === 'literal' && args[1]) {
		throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
	}

	// Case C: Anonymous path — starts with a constant-style identifier.
	// Constant-style names (all-uppercase) cannot be memory allocation names; treat as anonymous.
	// When followed by additional tokens they form a split-byte sequence.
	if (
		result.firstArg.type === 'identifier' &&
		args[0].type === ArgumentType.IDENTIFIER &&
		args[0].referenceKind === 'constant'
	) {
		if (args[1]) {
			if (!isSplitByteCandidate(args[1])) {
				throw new SyntaxRulesError(SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS);
			}
			// Two or more tokens: collect all as split-byte-tokens
			const tokens: SplitByteToken[] = [
				{ type: 'identifier', value: result.firstArg.value },
				...collectSplitByteTokens(args, 1),
			];
			result.firstArg = { type: 'split-byte-tokens', tokens };
		}
		// Single constant-style identifier: keep as identifier (resolved to constant value in semantic phase)
		return result;
	}

	// Case D: Named declaration — non-constant-style identifier as first arg.
	if (result.firstArg.type === 'identifier') {
		if (args[2]) {
			// Two or more default tokens: all must be split-byte candidates
			const tokens = collectSplitByteTokens(args, 1);
			result.secondArg = { type: 'split-byte-tokens', tokens };
		} else if (args[1]) {
			// Single default token: classify normally
			result.secondArg = classifyArgument(args[1]);
		}
		return result;
	}

	// Case E: Non-identifier first arg (special references, etc.) — classify second arg if present
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

	if (arg.type !== ArgumentType.IDENTIFIER) {
		throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT);
	}

	// Use the pre-classified referenceKind and extracted fields from the ArgumentIdentifier
	// instead of re-detecting patterns from raw strings.
	switch (arg.referenceKind) {
		case 'intermodular-reference':
			return {
				type: 'intermodular-reference',
				pattern: arg.value,
			};
		case 'intermodular-module-reference':
			return {
				type: 'intermodular-module-reference',
				module: arg.targetModuleId!,
				pattern: arg.value,
				isEndAddress: !!arg.isEndAddress,
			};
		case 'intermodular-element-count':
			return {
				type: 'intermodular-element-count',
				module: arg.targetModuleId!,
				memory: arg.targetMemoryId!,
				pattern: arg.value,
			};
		case 'intermodular-element-word-size':
			return {
				type: 'intermodular-element-word-size',
				module: arg.targetModuleId!,
				memory: arg.targetMemoryId!,
				pattern: arg.value,
			};
		case 'intermodular-element-max':
			return {
				type: 'intermodular-element-max',
				module: arg.targetModuleId!,
				memory: arg.targetMemoryId!,
				pattern: arg.value,
			};
		case 'intermodular-element-min':
			return {
				type: 'intermodular-element-min',
				module: arg.targetModuleId!,
				memory: arg.targetMemoryId!,
				pattern: arg.value,
			};
		case 'memory-reference':
			return {
				type: 'memory-reference',
				base: arg.targetMemoryId!,
				pattern: arg.value,
			};
		case 'element-count':
			return {
				type: 'element-count',
				base: arg.targetMemoryId!,
			};
		default:
			return {
				type: 'identifier',
				value: arg.value,
			};
	}
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
			const result = parseMemoryInstructionArgumentsShape([classifyIdentifier('&mod:id')]);
			expect(result.firstArg).toEqual({ type: 'intermodular-reference', pattern: '&mod:id' });
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
			expect(result.firstArg).toEqual({ type: 'memory-reference', base: 'foo', pattern: '&foo' });
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
			expect(() =>
				parseMemoryInstructionArgumentsShape([classifyIdentifier('HI'), classifyIdentifier('&buf')])
			).toThrow(SyntaxRulesError);
		});
	});
}
