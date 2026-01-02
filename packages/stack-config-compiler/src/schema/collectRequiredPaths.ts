/**
 * Collects all required paths from a schema tree
 */

import type { SchemaNode } from './types';

/**
 * Collects all required paths from a schema tree
 *
 * @param node - The schema node to traverse
 * @param currentPath - The current path prefix
 * @returns Array of required paths in dot notation
 */
export default function collectRequiredPaths(node: SchemaNode, currentPath: string = ''): string[] {
	const requiredPaths: string[] = [];

	for (const requiredKey of node.requiredChildren) {
		const fullPath = currentPath ? `${currentPath}.${requiredKey}` : requiredKey;
		requiredPaths.push(fullPath);

		// Recursively collect from child if it exists
		const childNode = node.children.get(requiredKey);
		if (childNode) {
			requiredPaths.push(...collectRequiredPaths(childNode, fullPath));
		}
	}

	return requiredPaths;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { default: preprocessSchema } = await import('./preprocessSchema');

	describe('collectRequiredPaths', () => {
		it('should collect required paths', () => {
			const schema = {
				type: 'object' as const,
				properties: {
					name: { type: 'string' as const },
					info: {
						type: 'object' as const,
						properties: {
							title: { type: 'string' as const },
						},
						required: ['title'],
					},
				},
				required: ['name', 'info'],
			};

			const root = preprocessSchema(schema);
			const paths = collectRequiredPaths(root);
			expect(paths).toContain('name');
			expect(paths).toContain('info');
			expect(paths).toContain('info.title');
		});
	});
}
