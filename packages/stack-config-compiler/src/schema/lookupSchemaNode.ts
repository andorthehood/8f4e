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
export default function lookupSchemaNode(root: SchemaNode, pathSegments: string[]): SchemaNode | null {
	return lookupSchemaNodeInternal(root, pathSegments, 0, false);
}

/**
 * Internal helper to navigate a path with support for alternatives
 */
function lookupSchemaNodeInternal(
	root: SchemaNode,
	pathSegments: string[],
	startIndex: number,
	inAlternative: boolean
): SchemaNode | null {
	let current = root;

	for (let i = startIndex; i < pathSegments.length; i++) {
		const segment = pathSegments[i];

		// Handle oneOf alternatives - try to find and merge schemas from alternatives
		if (current.oneOfAlternatives && current.oneOfAlternatives.length > 0) {
			// Collect all matching nodes from alternatives
			const matchingNodes: SchemaNode[] = [];
			for (const alt of current.oneOfAlternatives) {
				const result = lookupSchemaNodeInternal(alt, pathSegments, i, true);
				if (result !== null) {
					matchingNodes.push(result);
				}
			}

			if (matchingNodes.length === 0) {
				return null; // No alternative matched
			}

			// Merge the matching nodes to create a permissive union
			return mergeSchemaNodes(matchingNodes);
		}

		// Handle anyOf alternatives - try to find and merge schemas from alternatives
		if (current.anyOfAlternatives && current.anyOfAlternatives.length > 0) {
			// Collect all matching nodes from alternatives
			const matchingNodes: SchemaNode[] = [];
			for (const alt of current.anyOfAlternatives) {
				const result = lookupSchemaNodeInternal(alt, pathSegments, i, true);
				if (result !== null) {
					matchingNodes.push(result);
				}
			}

			if (matchingNodes.length === 0) {
				return null; // No alternative matched
			}

			// Merge the matching nodes to create a permissive union
			return mergeSchemaNodes(matchingNodes);
		}

		// Check if this is an array index or append slot
		if (segment.startsWith('[') && segment.endsWith(']')) {
			// Array index access or append slot
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
			// Property access - explicitly check for the property first
			const child = current.children.get(segment);
			if (child) {
				current = child;
			} else if (current.additionalPropertiesAllowed && !inAlternative) {
				// This ensures alternatives are matched only by their explicitly defined properties,
				// and not via fallback additionalProperties behavior, preventing them from matching everything
				// through additionalProperties.
				if (current.additionalPropertiesSchema) {
					current = current.additionalPropertiesSchema;
				} else {
					// No schema for additional properties, allow anything
					return createSchemaNode();
				}
			} else if (!current.additionalPropertiesAllowed) {
				// Unknown property and additional properties not allowed
				return null;
			} else {
				// In alternative and property not found explicitly
				return null;
			}
		}
	}

	return current;
}

/**
 * Merges multiple schema nodes into a single permissive node
 * Used to combine schemas from oneOf/anyOf alternatives
 */
function mergeSchemaNodes(nodes: SchemaNode[]): SchemaNode {
	if (nodes.length === 0) {
		return createSchemaNode();
	}
	if (nodes.length === 1) {
		return nodes[0];
	}

	const merged = createSchemaNode();

	// Merge types - include all types from all nodes
	for (const node of nodes) {
		for (const type of node.types) {
			merged.types.add(type);
		}
	}

	// Merge enum values - include all enum values from all nodes
	for (const node of nodes) {
		if (node.enumValues) {
			if (!merged.enumValues) {
				merged.enumValues = new Set();
			}
			for (const value of node.enumValues) {
				merged.enumValues.add(value);
			}
		}
	}

	// Merge children - include all children from all nodes
	const allChildKeys = new Set<string>();
	for (const node of nodes) {
		for (const key of node.children.keys()) {
			allChildKeys.add(key);
		}
	}

	for (const key of allChildKeys) {
		const childNodes = nodes.map(n => n.children.get(key)).filter((n): n is SchemaNode => n !== undefined);
		if (childNodes.length > 0) {
			merged.children.set(key, mergeSchemaNodes(childNodes));
		}
	}

	// Required children - only include fields required in ALL alternatives
	// This is permissive during field setting; post-compilation validation will check properly
	if (nodes.length > 0) {
		const firstRequired = Array.from(nodes[0].requiredChildren);
		for (const key of firstRequired) {
			if (nodes.every(n => n.requiredChildren.has(key))) {
				merged.requiredChildren.add(key);
			}
		}
	}

	// Additional properties - allow if any node allows
	merged.additionalPropertiesAllowed = nodes.some(n => n.additionalPropertiesAllowed);

	// Array handling
	merged.isArray = nodes.some(n => n.isArray);
	if (merged.isArray) {
		const itemSchemas = nodes.map(n => n.itemSchema).filter((s): s is SchemaNode => s !== undefined);
		if (itemSchemas.length > 0) {
			merged.itemSchema = mergeSchemaNodes(itemSchemas);
		}
	}

	return merged;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { default: preprocessSchema } = await import('./preprocessSchema');

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

		it('should lookup property in oneOf alternatives', () => {
			const schema: import('./types').JSONSchemaLike = {
				type: 'object',
				oneOf: [
					{
						properties: {
							runtime: { type: 'string', enum: ['audio'] },
							audioBuffers: { type: 'number' },
						},
					},
					{
						properties: {
							runtime: { type: 'string', enum: ['midi'] },
							midiChannels: { type: 'number' },
						},
					},
				],
			};

			const root = preprocessSchema(schema);

			// Should find audioBuffers in first alternative
			const audioNode = lookupSchemaNode(root, ['audioBuffers']);
			expect(audioNode).not.toBeNull();
			expect(audioNode?.types.has('number')).toBe(true);

			// Should find midiChannels in second alternative
			const midiNode = lookupSchemaNode(root, ['midiChannels']);
			expect(midiNode).not.toBeNull();
			expect(midiNode?.types.has('number')).toBe(true);

			// Should find runtime in both alternatives
			const runtimeNode = lookupSchemaNode(root, ['runtime']);
			expect(runtimeNode).not.toBeNull();
		});

		it('should lookup property in anyOf alternatives', () => {
			const schema: import('./types').JSONSchemaLike = {
				type: 'object',
				anyOf: [{ properties: { name: { type: 'string' } } }, { properties: { id: { type: 'number' } } }],
			};

			const root = preprocessSchema(schema);

			const nameNode = lookupSchemaNode(root, ['name']);
			expect(nameNode).not.toBeNull();
			expect(nameNode?.types.has('string')).toBe(true);

			const idNode = lookupSchemaNode(root, ['id']);
			expect(idNode).not.toBeNull();
			expect(idNode?.types.has('number')).toBe(true);
		});
	});
}
