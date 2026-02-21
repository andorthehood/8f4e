import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - schema validation', () => {
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
		const result = compileConfig([source], { schema });
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
		const result = compileConfig([source], { schema });
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
		const result = compileConfig([source], { schema });
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
		const result = compileConfig([source], { schema });
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
		const result = compileConfig([source], { schema });
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
		const result = compileConfig([source], { schema });
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
		const result = compileConfig([source], { schema });
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
		const result = compileConfig([source], { schema });
		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({ name: 'John', extraField: 'allowed' });
	});

	it('should not break existing callers who do not pass schema', () => {
		const source = `
scope "anyField"
push "anyValue"
set
`;
		const result = compileConfig([source]);
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
		const result = compileConfig([source], { schema });
		expect(result.config).toBeNull();
		expect(result.errors.some(e => e.path === 'info.title')).toBe(true);
	});

	it('should validate oneOf with discriminated union (runtime field)', () => {
		const schema = {
			type: 'object' as const,
			properties: {
				config: {
					type: 'object' as const,
					oneOf: [
						{
							properties: {
								runtime: { type: 'string' as const, enum: ['audio'] as const },
								audioOutputBuffers: { type: 'number' as const },
							},
							required: ['runtime', 'audioOutputBuffers'],
						},
						{
							properties: {
								runtime: { type: 'string' as const, enum: ['midi'] as const },
								midiNoteInputs: { type: 'number' as const },
							},
							required: ['runtime', 'midiNoteInputs'],
						},
					],
				},
			},
		};

		// Valid audio runtime config
		const audioSource = `
scope "config.runtime"
push "audio"
set

rescope "config.audioOutputBuffers"
push 2
set
`;
		const audioResult = compileConfig([audioSource], { schema });
		expect(audioResult.errors).toEqual([]);
		expect(audioResult.config).toEqual({
			config: {
				runtime: 'audio',
				audioOutputBuffers: 2,
			},
		});

		// Valid MIDI runtime config
		const midiSource = `
scope "config.runtime"
push "midi"
set

rescope "config.midiNoteInputs"
push 16
set
`;
		const midiResult = compileConfig([midiSource], { schema });
		expect(midiResult.errors).toEqual([]);
		expect(midiResult.config).toEqual({
			config: {
				runtime: 'midi',
				midiNoteInputs: 16,
			},
		});
	});

	it('should reject oneOf with wrong runtime-specific field', () => {
		const schema = {
			type: 'object' as const,
			properties: {
				config: {
					type: 'object' as const,
					oneOf: [
						{
							properties: {
								runtime: { type: 'string' as const, enum: ['audio'] as const },
								audioOutputBuffers: { type: 'number' as const },
							},
							required: ['runtime'],
							additionalProperties: false,
						},
						{
							properties: {
								runtime: { type: 'string' as const, enum: ['midi'] as const },
								midiNoteInputs: { type: 'number' as const },
							},
							required: ['runtime'],
							additionalProperties: false,
						},
					],
				},
			},
		};

		// Try to use MIDI-specific field with audio runtime
		const source = `
scope "config.runtime"
push "audio"
set

rescope "config.midiNoteInputs"
push 16
set
`;
		const result = compileConfig([source], { schema });
		// Should fail because midiNoteInputs is only valid for midi runtime
		// The oneOf validation should catch this
		expect(result.config).toBeNull();
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('should validate anyOf with overlapping shapes', () => {
		const schema = {
			type: 'object' as const,
			properties: {
				value: {
					anyOf: [{ type: 'string' as const }, { type: 'number' as const }],
				},
			},
		};

		// String value
		const stringSource = `
scope "value"
push "hello"
set
`;
		const stringResult = compileConfig([stringSource], { schema });
		expect(stringResult.errors).toEqual([]);
		expect(stringResult.config).toEqual({ value: 'hello' });

		// Number value
		const numberSource = `
scope "value"
push 42
set
`;
		const numberResult = compileConfig([numberSource], { schema });
		expect(numberResult.errors).toEqual([]);
		expect(numberResult.config).toEqual({ value: 42 });
	});

	it('should reject value that matches no anyOf alternatives', () => {
		const schema = {
			type: 'object' as const,
			properties: {
				value: {
					anyOf: [{ type: 'string' as const }, { type: 'number' as const }],
				},
			},
		};

		const source = `
scope "value"
push true
set
`;
		const result = compileConfig([source], { schema });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].kind).toBe('schema');
		expect(result.errors[0].message).toContain('does not match any anyOf alternatives');
	});

	it('should reject value that matches multiple oneOf alternatives', () => {
		const schema = {
			type: 'object' as const,
			properties: {
				value: {
					oneOf: [{ type: 'number' as const }, { type: ['number', 'string'] as const }],
				},
			},
		};

		// Number matches both alternatives (ambiguous)
		const source = `
scope "value"
push 42
set
`;
		const result = compileConfig([source], { schema });
		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].kind).toBe('schema');
		expect(result.errors[0].message).toContain('matches multiple oneOf alternatives');
	});
});
