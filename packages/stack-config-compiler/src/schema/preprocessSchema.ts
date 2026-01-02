/**
 * Preprocesses a JSON Schema into a VM-friendly SchemaNode tree
 */

import { createSchemaNode } from './types';

import type { JSONSchemaLike, JSONSchemaType, SchemaNode } from './types';

/**
 * Normalizes a type field to a Set of types
 */
function normalizeTypes(type: JSONSchemaType | JSONSchemaType[] | undefined): Set<JSONSchemaType> {
	if (!type) {
		return new Set();
	}
	if (Array.isArray(type)) {
		return new Set(type);
	}
	return new Set([type]);
}

/**
 * Preprocesses a JSON Schema into a VM-friendly SchemaNode tree
 *
 * @param schema - The JSON Schema to preprocess
 * @returns A SchemaNode tree for efficient path and value validation
 */
export default function preprocessSchema(schema: JSONSchemaLike): SchemaNode {
	const types = normalizeTypes(schema.type);
	const isArray = types.has('array');

	const node = createSchemaNode(isArray);
	node.types = types;

	// Handle enum constraint
	if (schema.enum) {
		node.enumValues = new Set(schema.enum);
	}

	// Handle object properties
	if (schema.properties) {
		for (const [key, childSchema] of Object.entries(schema.properties)) {
			node.children.set(key, preprocessSchema(childSchema));
		}
	}

	// Handle required fields
	if (schema.required) {
		for (const key of schema.required) {
			node.requiredChildren.add(key);
		}
	}

	// Handle array items
	if (schema.items) {
		node.itemSchema = preprocessSchema(schema.items);
	}

	// Handle additional properties
	if (schema.additionalProperties === false) {
		node.additionalPropertiesAllowed = false;
	} else if (typeof schema.additionalProperties === 'object') {
		node.additionalPropertiesAllowed = true;
		node.additionalPropertiesSchema = preprocessSchema(schema.additionalProperties);
	}

	return node;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('preprocessSchema', () => {
		it('should preprocess a simple schema', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					age: { type: 'number' },
				},
				required: ['name'],
			};

			const node = preprocessSchema(schema);
			expect(node.types.has('object')).toBe(true);
			expect(node.children.has('name')).toBe(true);
			expect(node.children.has('age')).toBe(true);
			expect(node.requiredChildren.has('name')).toBe(true);
			expect(node.requiredChildren.has('age')).toBe(false);
		});

		it('should handle array type', () => {
			const schema: JSONSchemaLike = {
				type: 'array',
				items: { type: 'string' },
			};

			const node = preprocessSchema(schema);
			expect(node.isArray).toBe(true);
			expect(node.itemSchema?.types.has('string')).toBe(true);
		});

		it('should handle enum constraint', () => {
			const schema: JSONSchemaLike = {
				type: 'string',
				enum: ['a', 'b', 'c'],
			};

			const node = preprocessSchema(schema);
			expect(node.enumValues?.has('a')).toBe(true);
			expect(node.enumValues?.has('d')).toBe(false);
		});

		it('should handle additionalProperties: false', () => {
			const schema: JSONSchemaLike = {
				type: 'object',
				properties: { name: { type: 'string' } },
				additionalProperties: false,
			};

			const node = preprocessSchema(schema);
			expect(node.additionalPropertiesAllowed).toBe(false);
		});
	});
}
