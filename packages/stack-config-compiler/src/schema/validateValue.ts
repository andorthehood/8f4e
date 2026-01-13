/**
 * Validates a value against a schema node
 */

import type { JSONSchemaType, SchemaNode, JSONSchemaLike } from './types';

/**
 * Validates a value against a schema node
 *
 * @param node - The schema node to validate against
 * @param value - The value to validate
 * @returns An error message if invalid, null if valid
 */
export default function validateValue(node: SchemaNode, value: unknown): string | null {
	// Handle oneOf combinator - exactly one alternative must validate
	if (node.oneOfAlternatives && node.oneOfAlternatives.length > 0) {
		const validAlternatives = node.oneOfAlternatives.filter(alt => validateValue(alt, value) === null);

		if (validAlternatives.length === 0) {
			return 'Value does not match any oneOf alternatives';
		}
		if (validAlternatives.length > 1) {
			return `Value matches multiple oneOf alternatives (${validAlternatives.length} matches), exactly one expected`;
		}
		// Exactly one match - valid
		return null;
	}

	// Handle anyOf combinator - at least one alternative must validate
	if (node.anyOfAlternatives && node.anyOfAlternatives.length > 0) {
		const hasValidAlternative = node.anyOfAlternatives.some(alt => validateValue(alt, value) === null);

		if (!hasValidAlternative) {
			return 'Value does not match any anyOf alternatives';
		}
		// At least one match - valid
		return null;
	}

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

		it('should validate oneOf with exactly one match', () => {
			const schema: JSONSchemaLike = {
				oneOf: [{ type: 'string' as const }, { type: 'number' as const }],
			};
			const node = preprocessSchema(schema);
			expect(validateValue(node, 'hello')).toBeNull();
			expect(validateValue(node, 42)).toBeNull();
		});

		it('should reject oneOf with no matches', () => {
			const schema: JSONSchemaLike = {
				oneOf: [{ type: 'string' as const }, { type: 'number' as const }],
			};
			const node = preprocessSchema(schema);
			const error = validateValue(node, true);
			expect(error).toContain('does not match any oneOf alternatives');
		});

		it('should reject oneOf with multiple matches', () => {
			const schema: JSONSchemaLike = {
				oneOf: [{ type: 'number' as const }, { type: ['number', 'string'] as const }],
			};
			const node = preprocessSchema(schema);
			const error = validateValue(node, 42);
			expect(error).toContain('matches multiple oneOf alternatives');
		});

		it('should validate anyOf with at least one match', () => {
			const schema: JSONSchemaLike = {
				anyOf: [{ type: 'string' as const }, { type: 'number' as const }],
			};
			const node = preprocessSchema(schema);
			expect(validateValue(node, 'hello')).toBeNull();
			expect(validateValue(node, 42)).toBeNull();
		});

		it('should reject anyOf with no matches', () => {
			const schema: JSONSchemaLike = {
				anyOf: [{ type: 'string' as const }, { type: 'number' as const }],
			};
			const node = preprocessSchema(schema);
			const error = validateValue(node, true);
			expect(error).toContain('does not match any anyOf alternatives');
		});
	});
}
