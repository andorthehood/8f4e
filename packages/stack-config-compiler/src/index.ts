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
 * const blocks = [`
 * scope "instrument.name"
 * push "Piano"
 * set
 *
 * rescopeTop "volume"
 * push 0.8
 * set
 * `];
 *
 * const result = compileConfig(blocks);
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
 * const result = compileConfig(blocks, { schema });
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
 * @param sourceBlocks - Config block sources in execution order (one command per line)
 * @param options - Optional configuration including JSON Schema for validation
 * @returns An object containing:
 *   - `config`: The resulting JSON-compatible object, or `null` if there were errors
 *   - `errors`: An array of error objects with `line` (1-based) and `message` properties
 *
 * @example
 * ```ts
 * const result = compileConfig([`
 * scope "name"
 * push "Piano"
 * set
 * `]);
 *
 * if (result.errors.length === 0) {
 *   console.log(result.config); // { name: "Piano" }
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function compileConfig(sourceBlocks: string[], options?: CompileOptions): CompileResult {
	const schemaRoot = options?.schema ? preprocessSchema(options.schema) : undefined;
	const errors: CompileError[] = [];
	let config: Record<string, unknown> = {};
	const writtenPaths = schemaRoot ? new Set<string>() : undefined;

	for (let blockIndex = 0; blockIndex < sourceBlocks.length; blockIndex += 1) {
		const source = sourceBlocks[blockIndex];

		if (source.trim().length === 0) {
			continue;
		}

		const { commands, errors: parseErrors } = parse(source);

		if (parseErrors.length > 0) {
			for (const error of parseErrors) {
				errors.push({
					...error,
					kind: 'parse',
					blockIndex,
				});
			}
			continue;
		}

		const { config: blockConfig, errors: execErrors } = executeCommands(commands, schemaRoot, {
			config,
			writtenPaths,
		});
		config = blockConfig;

		for (const error of execErrors) {
			errors.push({
				...error,
				blockIndex,
			});
		}
	}

	if (errors.length > 0) {
		return {
			config: null,
			errors,
		};
	}

	// Check for missing required fields if schema provided
	const missingFieldsErrors: CompileError[] =
		schemaRoot && writtenPaths ? findMissingRequiredFields(schemaRoot, writtenPaths).map(error => ({ ...error })) : [];

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
				// Report at line 1 for whole-config validations since these errors validate
				// the final assembled config object, not individual set commands
				line: 1,
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
