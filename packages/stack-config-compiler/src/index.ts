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
 *
 * @example
 * ```ts
 * // With schema validation
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     instrument: {
 *       type: 'object',
 *       properties: {
 *         name: { type: 'string' },
 *         volume: { type: 'number' }
 *       },
 *       required: ['name']
 *     }
 *   }
 * };
 *
 * const result = compileConfig(source, { schema });
 * // Schema errors will include path and kind: 'schema'
 * ```
 */

import parse from './parser/parse';
import executeCommands from './vm/executeCommands';
import { preprocessSchema, findMissingRequiredFields, validateCombinators } from './schema';

import type { CompileError, CompileOptions, CompileResult } from './types';
import type { SchemaValidationError } from './schema';

export type {
	CompileResult,
	CompileError,
	CompileOptions,
	CompileErrorKind,
	Literal,
	Command,
	CommandType,
} from './types';
export type { JSONSchemaLike, JSONSchemaType } from './schema';

/**
 * Compiles a stack config source program into a JSON-compatible object.
 *
 * @param source - The source code in stack config language (one command per line)
 * @param options - Optional configuration including JSON Schema for validation
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
export function compileConfig(source: string, options?: CompileOptions): CompileResult {
	const { commands, errors: parseErrors } = parse(source);

	if (parseErrors.length > 0) {
		return {
			config: null,
			errors: parseErrors.map(e => ({ ...e, kind: 'parse' as const })),
		};
	}

	const schemaRoot = options?.schema ? preprocessSchema(options.schema) : undefined;
	const { config, errors: execErrors, writtenPaths } = executeCommands(commands, schemaRoot);

	if (execErrors.length > 0) {
		return {
			config: null,
			errors: execErrors,
		};
	}

	// Check for missing required fields if schema provided
	const missingFieldsErrors: CompileError[] =
		schemaRoot && writtenPaths ? findMissingRequiredFields(schemaRoot, writtenPaths) : [];

	if (missingFieldsErrors.length > 0) {
		return {
			config: null,
			errors: missingFieldsErrors,
		};
	}

	// Validate oneOf/anyOf combinators if schema provided
	const combinatorErrors: CompileError[] = schemaRoot
		? validateCombinators(schemaRoot, config).map((err: SchemaValidationError) => ({
				...err,
				line: 1, // Report at line 1 since these are whole-config validations
			}))
		: [];

	if (combinatorErrors.length > 0) {
		return {
			config: null,
			errors: combinatorErrors,
		};
	}

	return {
		config,
		errors: [],
	};
}
