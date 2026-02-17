import { ArgumentType, type Argument } from './parseArgument';
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

export type MemoryArgumentShape =
	| { type: 'literal'; value: number }
	| { type: 'identifier'; value: string }
	| { type: 'memory-reference'; base: string; pattern: string }
	| { type: 'element-count'; base: string }
	| { type: 'intermodular-reference'; pattern: string }
	| { type: 'intermodular-element-count'; module: string; memory: string; pattern: string }
	| { type: 'intermodular-element-word-size'; module: string; memory: string; pattern: string }
	| { type: 'intermodular-element-max'; module: string; memory: string; pattern: string };

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
