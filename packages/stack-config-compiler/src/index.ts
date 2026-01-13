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
import { preprocessSchema, findMissingRequiredFields } from './schema';

import type { CompileError, CompileOptions, CompileResult } from './types';

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
	const schemaErrors: CompileError[] =
		schemaRoot && writtenPaths ? findMissingRequiredFields(schemaRoot, writtenPaths) : [];

	if (schemaErrors.length > 0) {
		return {
			config: null,
			errors: schemaErrors,
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

; popScope pops scope level
popScope
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

; Semicolon inside string (should not be treated as comment)
rescope "semicolonTest"
push "text ; with semicolon"
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

; rescopeSuffix replaces trailing suffix
rescope "icons.piano.title"
push "Piano Icon"
set

rescopeSuffix "harp.title"
push "Harp Icon"
set

; rescopeSuffix with array indices
rescope "settings.runtime[0].config"
push "dev"
set

rescopeSuffix "runtime[1].config"
push "prod"
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

		it('should compile concat with two strings', () => {
			const source = `
scope "message"
push "foo"
push "bar"
concat
set
`;
			const result = compileConfig(source);
			expect(result.errors).toEqual([]);
			expect(result.config).toEqual({ message: 'foobar' });
		});

		it('should compile concat with three or more values', () => {
			const source = `
scope "combined"
push "foo"
push "bar"
push 123
concat
set
`;
			const result = compileConfig(source);
			expect(result.errors).toEqual([]);
			expect(result.config).toEqual({ combined: 'foobar123' });
		});

		it('should coerce non-string values with concat', () => {
			const source = `
scope "coerced"
push "value:"
push true
push null
push 42
concat
set
`;
			const result = compileConfig(source);
			expect(result.errors).toEqual([]);
			expect(result.config).toEqual({ coerced: 'value:truenull42' });
		});

		it('should return error for concat on empty stack', () => {
			const source = `
scope "test"
concat
set
`;
			const result = compileConfig(source);
			expect(result.config).toBeNull();
			expect(result.errors).toMatchSnapshot();
		});

		it('should handle single value concat', () => {
			const source = `
scope "single"
push "only"
concat
set
`;
			const result = compileConfig(source);
			expect(result.errors).toEqual([]);
			expect(result.config).toEqual({ single: 'only' });
		});

		describe('with schema validation', () => {
			it('should pass validation when config conforms to schema', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						name: { type: 'string' as const },
						age: { type: 'number' as const },
					},
					required: ['name'],
				};

				const source = `
scope "name"
push "John"
set

rescope "age"
push 30
set
`;
				const result = compileConfig(source, { schema });
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({ name: 'John', age: 30 });
			});

			it('should detect unknown keys at navigation (scope)', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						title: { type: 'string' as const },
					},
					additionalProperties: false,
				};

				const source = `
scope "titel"
push "My Title"
set
`;
				const result = compileConfig(source, { schema });
				expect(result.config).toBeNull();
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].kind).toBe('schema');
				expect(result.errors[0].path).toBe('titel');
				expect(result.errors[0].message).toContain('Unknown key "titel"');
			});

			it('should detect type mismatch at set', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						count: { type: 'number' as const },
					},
				};

				const source = `
scope "count"
push "not a number"
set
`;
				const result = compileConfig(source, { schema });
				expect(result.config).toBeNull();
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].kind).toBe('schema');
				expect(result.errors[0].path).toBe('count');
				expect(result.errors[0].message).toContain('Expected type number, got string');
			});

			it('should detect enum violation', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						status: { type: 'string' as const, enum: ['active', 'inactive', 'pending'] as const },
					},
				};

				const source = `
scope "status"
push "unknown"
set
`;
				const result = compileConfig(source, { schema });
				expect(result.config).toBeNull();
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].kind).toBe('schema');
				expect(result.errors[0].message).toContain('not in allowed values');
			});

			it('should detect missing required fields', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						name: { type: 'string' as const },
						email: { type: 'string' as const },
					},
					required: ['name', 'email'],
				};

				const source = `
scope "name"
push "John"
set
`;
				const result = compileConfig(source, { schema });
				expect(result.config).toBeNull();
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].kind).toBe('schema');
				expect(result.errors[0].path).toBe('email');
				expect(result.errors[0].line).toBe(1);
				expect(result.errors[0].message).toContain('Missing required field');
			});

			it('should detect nested unknown keys', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						projectInfo: {
							type: 'object' as const,
							properties: {
								title: { type: 'string' as const },
								author: { type: 'string' as const },
							},
							additionalProperties: false,
						},
					},
				};

				const source = `
scope "projectInfo"
scope "titel"
push "My Project"
set
`;
				const result = compileConfig(source, { schema });
				expect(result.config).toBeNull();
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].kind).toBe('schema');
				expect(result.errors[0].message).toContain('Unknown key "titel"');
			});

			it('should validate array items', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						items: {
							type: 'array' as const,
							items: { type: 'number' as const },
						},
					},
				};

				const source = `
scope "items"
push "not a number"
append
`;
				const result = compileConfig(source, { schema });
				expect(result.config).toBeNull();
				expect(result.errors.some(e => e.kind === 'schema' && e.message.includes('Expected type number'))).toBe(true);
			});

			it('should allow additional properties when not restricted', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						name: { type: 'string' as const },
					},
				};

				const source = `
scope "name"
push "John"
set

rescope "extraField"
push "allowed"
set
`;
				const result = compileConfig(source, { schema });
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({ name: 'John', extraField: 'allowed' });
			});

			it('should not break existing callers who do not pass schema', () => {
				const source = `
scope "anyField"
push "anyValue"
set
`;
				const result = compileConfig(source);
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({ anyField: 'anyValue' });
			});

			it('should validate nested required fields', () => {
				const schema = {
					type: 'object' as const,
					properties: {
						info: {
							type: 'object' as const,
							properties: {
								title: { type: 'string' as const },
							},
							required: ['title'],
						},
					},
					required: ['info'],
				};

				const source = `
scope "info.description"
push "Some text"
set
`;
				const result = compileConfig(source, { schema });
				expect(result.config).toBeNull();
				expect(result.errors.some(e => e.path === 'info.title')).toBe(true);
			});
		});

		describe('const command', () => {
			it('should define and use constants', () => {
				const source = `
const BASE_PATH "/var/lib"
const MAX_COUNT 100

scope "config.path"
push BASE_PATH
set

rescope "config.count"
push MAX_COUNT
set
`;
				const result = compileConfig(source);
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({
					config: {
						path: '/var/lib',
						count: 100,
					},
				});
			});

			it('should handle scoped constants', () => {
				const source = `
const GLOBAL "global value"

scope "first"
const LOCAL "first local"
push LOCAL
set

rescope "second"
const LOCAL "second local"
push LOCAL
set

rescope "global"
push GLOBAL
set
`;
				const result = compileConfig(source);
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({
					first: 'first local',
					second: 'second local',
					global: 'global value',
				});
			});

			it('should shadow outer scope constants', () => {
				const source = `
const NAME "outer"

scope "outer.value"
push NAME
set

rescopeTop "inner"
const NAME "inner"
scope "value"
push NAME
set

popScope
rescopeTop "after.value"
push NAME
set
`;
				const result = compileConfig(source);
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({
					outer: {
						value: 'outer',
						inner: {
							value: 'inner',
						},
						after: {
							value: 'outer',
						},
					},
				});
			});

			it('should error on unknown constant', () => {
				const source = `
scope "test"
push UNKNOWN
set
`;
				const result = compileConfig(source);
				expect(result.config).toBeNull();
				expect(result.errors).toMatchSnapshot();
			});

			it('should error on same-scope redefinition', () => {
				const source = `
const NAME "first"
const NAME "second"
`;
				const result = compileConfig(source);
				expect(result.config).toBeNull();
				expect(result.errors).toMatchSnapshot();
			});

			it('should allow constants with different types', () => {
				const source = `
const STR_VAL "text"
const NUM_VAL 42
const BOOL_VAL true
const NULL_VAL null

scope "test.str"
push STR_VAL
set

rescopeTop "num"
push NUM_VAL
set

rescopeTop "bool"
push BOOL_VAL
set

rescopeTop "null"
push NULL_VAL
set
`;
				const result = compileConfig(source);
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({
					test: {
						str: 'text',
						num: 42,
						bool: true,
						null: null,
					},
				});
			});

			it('should clean up constants when popping scope', () => {
				const source = `
scope "level1"
const VAL1 "first"
scope "value"
push VAL1
set

rescopeTop "level2.value"
const VAL2 "second"
push VAL2
set

popScope
rescopeTop "after"
; VAL2 should be cleaned up, but VAL1 should still exist
push VAL1
set
`;
				const result = compileConfig(source);
				expect(result.errors).toEqual([]);
				expect(result.config).toEqual({
					level1: {
						value: 'first',
						level2: {
							value: 'second',
						},
						after: 'first',
					},
				});
			});
		});
	});
}
