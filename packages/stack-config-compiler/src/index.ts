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
