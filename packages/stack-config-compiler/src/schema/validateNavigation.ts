/**
 * Validates navigation for a single path segment
 */

import { lookupSchemaNode } from './lookupSchemaNode';
import { validateNavigationSegment } from './validateNavigationSegment';

import type { SchemaNode, SchemaValidationError } from './types';

/**
 * Validates navigation for a single path segment and returns an error if invalid.
 * Used by scope/rescope/rescopeTop commands.
 *
 * @param schemaRoot - Root schema node
 * @param scopeStack - Current scope stack before adding the segment
 * @param segment - The segment being navigated to
 * @returns An error object if invalid, null if valid
 */
export function validateNavigation(
	schemaRoot: SchemaNode,
	scopeStack: string[],
	segment: string
): SchemaValidationError | null {
	const currentPath = scopeStack.join('.');
	const currentNode = currentPath ? lookupSchemaNode(schemaRoot, scopeStack) : schemaRoot;

	if (!currentNode) {
		return null; // Parent path not found in schema, skip validation
	}

	const navError = validateNavigationSegment(currentNode, segment);
	if (navError) {
		const fullPath = currentPath ? `${currentPath}.${segment}` : segment;
		return {
			message: navError,
			path: fullPath,
		};
	}

	return null;
}
