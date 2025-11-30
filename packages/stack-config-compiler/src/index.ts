/**
 * @8f4e/stack-config-compiler
 *
 * A stack-machine-inspired config language compiler for 8f4e.
 * Parses and executes stack-based config programs to produce JSON objects.
 *
 * @example
 * ```ts
 * import { compileConfig } from '@8f4e/stack-config-compiler';
 *
 * const source = `
 * scope "instrument.name"
 * push "Piano"
 * set
 *
 * rescopeTop "volume"
 * push 0.8
 * set
 * `;
 *
 * const result = compileConfig(source);
 * // result.config = { instrument: { name: "Piano", volume: 0.8 } }
 * // result.errors = []
 * ```
 */

import { parse } from './parser';
import { executeCommands } from './vm';

import type { CompileResult } from './types';

export type { CompileResult, CompileError, Literal, Command, CommandType } from './types';

/**
 * Compiles a stack config source program into a JSON-compatible object.
 *
 * @param source - The source code in stack config language (one command per line)
 * @returns An object containing:
 *   - `config`: The resulting JSON-compatible object, or `null` if there were errors
 *   - `errors`: An array of error objects with `line` (1-based) and `message` properties
 *
 * @example
 * ```ts
 * const result = compileConfig(`
 * scope "name"
 * push "Piano"
 * set
 * `);
 *
 * if (result.errors.length === 0) {
 *   console.log(result.config); // { name: "Piano" }
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function compileConfig(source: string): CompileResult {
	// Parse the source into commands
	const { commands, errors: parseErrors } = parse(source);

	// If there were parse errors, return them immediately
	if (parseErrors.length > 0) {
		return {
			config: null,
			errors: parseErrors,
		};
	}

	// Execute the commands
	const { config, errors: execErrors } = executeCommands(commands);

	// If there were execution errors, return null config
	if (execErrors.length > 0) {
		return {
			config: null,
			errors: execErrors,
		};
	}

	return {
		config,
		errors: [],
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('compileConfig', () => {
		it('should compile a comprehensive example covering all features', () => {
			const source = `
; ============================================
; Comprehensive stack-config-compiler example
; ============================================

; Basic string value
scope "instrument.name"
push "Piano"
set

; Number value with rescopeTop
rescopeTop "volume"
push 0.8
set

; Array value (multiple pushes create array)
rescopeTop "tags"
push "keyboard"
push "acoustic"
set

; Boolean values
rescopeTop "enabled"
push true
set

rescopeTop "muted"
push false
set

; Null value
rescopeTop "parent"
push null
set

; Inline comments are supported
rescopeTop "notes" ; switching to notes field
push "C4" ; middle C
push "E4" ; major third
push "G4" ; perfect fifth
set ; creates a chord array

; rescope replaces entire scope
rescope "icons.piano"
scope "color"
push "blue"
set

; endScope pops scope level
endScope
scope "size"
push 48
set

; Nested objects via dot notation
rescope "settings.audio.gain"
push 0.75
set

; Array indices
rescope "channels[0]"
push "left"
set

rescope "channels[1]"
push "right"
set

; append command
rescope "effects"
push "reverb"
push "delay"
set
push "chorus"
append

; String escaping
rescope "message"
push "He said \\"hello\\""
set

rescope "path"
push "C:\\\\Users\\\\test"
set

rescope "formatted"
push "line1\\nline2\\ttabbed"
set

; Mixed object and array paths
rescope "matrix[0][0]"
push 1
set

rescope "matrix[0][1]"
push 2
set

rescope "data.items[0].name"
push "first"
set
`;

			const result = compileConfig(source);
			expect(result.errors).toEqual([]);
			expect(result.config).toMatchSnapshot();
		});

		it('should return errors for invalid input', () => {
			const source = `
scope "test"
unknownCommand
push "value"
set
`;
			const result = compileConfig(source);
			expect(result.config).toBeNull();
			expect(result.errors).toMatchSnapshot();
		});

		it('should return error for type conflict', () => {
			const source = `
scope "name"
push "Piano"
set

scope "name.nested"
push "value"
set
`;
			const result = compileConfig(source);
			expect(result.config).toBeNull();
			expect(result.errors).toMatchSnapshot();
		});

		it('should return error for unclosed string literal', () => {
			const source = `
scope "name"
push "unclosed
set
`;
			const result = compileConfig(source);
			expect(result.config).toBeNull();
			expect(result.errors).toMatchSnapshot();
		});

		it('should return error for malformed path', () => {
			const source = `
scope "items[0"
push "value"
set
`;
			const result = compileConfig(source);
			expect(result.config).toBeNull();
			expect(result.errors).toMatchSnapshot();
		});

		it('should return error for operations on empty stacks', () => {
			const source = `
set
`;
			const result = compileConfig(source);
			expect(result.config).toBeNull();
			expect(result.errors).toMatchSnapshot();
		});

		it('should return error for append to non-array', () => {
			const source = `
scope "name"
push "string"
set
push "extra"
append
`;
			const result = compileConfig(source);
			expect(result.config).toBeNull();
			expect(result.errors).toMatchSnapshot();
		});
	});
}
