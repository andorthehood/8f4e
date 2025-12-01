/**
 * Looks up a schema node at a given path
 */

import { createSchemaNode } from './types';

import type { SchemaNode } from './types';

/**
 * Looks up a schema node at a given path
 *
 * @param root - The root schema node
 * @param pathSegments - Path segments (e.g., ['projectInfo', 'title'] or ['items', '[0]'])
 * @returns The schema node at the path, or null if the path is not allowed
 */
export function lookupSchemaNode(root: SchemaNode, pathSegments: string[]): SchemaNode | null {
	let current = root;

	for (const segment of pathSegments) {
		// Check if this is an array index
		if (segment.startsWith('[') && segment.endsWith(']')) {
			// Array index access
			if (!current.isArray) {
				return null; // Trying to index into non-array
			}
			// Move to the item schema
			if (current.itemSchema) {
				current = current.itemSchema;
			} else {
				// No item schema defined, allow any item but no further validation
				return createSchemaNode();
			}
		} else {
			// Property access
			const child = current.children.get(segment);
			if (child) {
				current = child;
			} else if (current.additionalPropertiesAllowed) {
				// Unknown property, but additional properties are allowed
				if (current.additionalPropertiesSchema) {
					current = current.additionalPropertiesSchema;
				} else {
					// No schema for additional properties, allow anything
					return createSchemaNode();
				}
			} else {
				// Unknown property and additional properties not allowed
				return null;
			}
		}
	}

	return current;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { preprocessSchema } = await import('./preprocessSchema');

	describe('lookupSchemaNode', () => {
		it('should find a child node', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					projectInfo: {
						type: 'object' as const,
						properties: {
							title: { type: 'string' as const },
						},
					},
				},
			};

			const root = preprocessSchema(schema);
			const node = lookupSchemaNode(root, ['projectInfo', 'title']);
			expect(node).not.toBeNull();
			expect(node?.types.has('string')).toBe(true);
		});

		it('should handle array items', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					items: {
						type: 'array' as const,
						items: { type: 'number' as const },
					},
				},
			};

			const root = preprocessSchema(schema);
			const node = lookupSchemaNode(root, ['items', '[0]']);
			expect(node).not.toBeNull();
			expect(node?.types.has('number')).toBe(true);
		});

		it('should return null for unknown property when additionalProperties is false', () => {
			const schema = {
				type: 'object' as const,
				properties: { name: { type: 'string' as const } },
				additionalProperties: false,
			};

			const root = preprocessSchema(schema);
			const node = lookupSchemaNode(root, ['unknown']);
			expect(node).toBeNull();
		});
	});
}
