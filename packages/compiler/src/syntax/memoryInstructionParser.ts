import { ArgumentType, type Argument } from './parseArgument';
import { SyntaxRulesError, SyntaxErrorCode } from './syntaxError';
import { hasMemoryReferencePrefix } from './hasMemoryReferencePrefix';
import { hasElementCountPrefix } from './hasElementCountPrefix';
import { extractMemoryReferenceBase } from './extractMemoryReferenceBase';
import { extractElementCountBase } from './extractElementCountBase';
import { isIntermodularReference } from './isIntermodularReference';

export type MemoryArgumentShape =
	| { type: 'literal'; value: number }
	| { type: 'identifier'; value: string }
	| { type: 'memory-reference'; base: string; pattern: string }
	| { type: 'element-count'; base: string }
	| { type: 'intermodular-reference'; pattern: string };

export interface ParsedMemoryInstructionArguments {
	firstArg: MemoryArgumentShape;
	secondArg?: MemoryArgumentShape;
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
		throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'First argument is required');
	}

	const result: ParsedMemoryInstructionArguments = {
		firstArg: classifyArgument(args[0]),
	};

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
