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
