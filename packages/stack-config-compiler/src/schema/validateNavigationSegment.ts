/**
 * Validates a navigation path segment against a schema node
 */

import type { SchemaNode } from './types';

/**
 * Checks if a navigation path segment is valid according to the schema
 *
 * @param currentNode - The current schema node
 * @param segment - The path segment to navigate to
 * @returns An error message if invalid, null if valid
 */
export function validateNavigationSegment(currentNode: SchemaNode, segment: string): string | null {
	// Check if this is an array index
	if (segment.startsWith('[') && segment.endsWith(']')) {
		// Array index access - check if current node allows arrays
		if (!currentNode.isArray && currentNode.types.size > 0 && !currentNode.types.has('array')) {
			return `Cannot use array index "${segment}" on non-array type`;
		}
		return null;
	}

	// Property access
	if (currentNode.children.has(segment)) {
		return null; // Valid property
	}

	if (currentNode.additionalPropertiesAllowed) {
		return null; // Additional properties allowed
	}

	// Unknown key error
	const knownKeys = Array.from(currentNode.children.keys());
	if (knownKeys.length > 0) {
		return `Unknown key "${segment}". Known keys: ${knownKeys.join(', ')}`;
	}
	return `Unknown key "${segment}"`;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { preprocessSchema } = await import('./preprocessSchema');

	describe('validateNavigationSegment', () => {
		it('should allow known property', () => {
			const schema = {
				type: 'object' as const,
				properties: { name: { type: 'string' as const } },
				additionalProperties: false,
			};

			const root = preprocessSchema(schema);
			const error = validateNavigationSegment(root, 'name');
			expect(error).toBeNull();
		});

		it('should reject unknown property when additionalProperties is false', () => {
			const schema = {
				type: 'object' as const,
				properties: { name: { type: 'string' as const } },
				additionalProperties: false,
			};

			const root = preprocessSchema(schema);
			const error = validateNavigationSegment(root, 'titel');
			expect(error).toContain('Unknown key "titel"');
		});
	});
}
