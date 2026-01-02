/**
 * Validates a value against a schema node
 */

import type { JSONSchemaType, SchemaNode } from './types';

/**
 * Validates a value against a schema node
 *
 * @param node - The schema node to validate against
 * @param value - The value to validate
 * @returns An error message if invalid, null if valid
 */
export default function validateValue(node: SchemaNode, value: unknown): string | null {
	// Determine the actual type of the value
	let actualType: JSONSchemaType;
	if (value === null) {
		actualType = 'null';
	} else if (Array.isArray(value)) {
		actualType = 'array';
	} else {
		actualType = typeof value as JSONSchemaType;
	}

	// Check type constraint
	if (node.types.size > 0 && !node.types.has(actualType)) {
		const expectedTypes = Array.from(node.types).join(' | ');
		return `Expected type ${expectedTypes}, got ${actualType}`;
	}

	// Check enum constraint
	if (node.enumValues && !node.enumValues.has(value as string | number | boolean | null)) {
		const allowedValues = Array.from(node.enumValues)
			.map(v => JSON.stringify(v))
			.join(', ');
		return `Value ${JSON.stringify(value)} not in allowed values: ${allowedValues}`;
	}

	return null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { default: preprocessSchema } = await import('./preprocessSchema');

	describe('validateValue', () => {
		it('should validate correct type', () => {
			const schema = { type: 'string' as const };
			const node = preprocessSchema(schema);
			expect(validateValue(node, 'hello')).toBeNull();
		});

		it('should reject wrong type', () => {
			const schema = { type: 'number' as const };
			const node = preprocessSchema(schema);
			const error = validateValue(node, 'hello');
			expect(error).toContain('Expected type number, got string');
		});

		it('should validate enum values', () => {
			const schema = { type: 'number' as const, enum: [0, 1, 2] as const };
			const node = preprocessSchema(schema);
			expect(validateValue(node, 1)).toBeNull();
			const error = validateValue(node, 5);
			expect(error).toContain('not in allowed values');
		});
	});
}
