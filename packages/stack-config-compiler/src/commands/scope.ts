/**
 * Scope command - pushes path segments onto the scope stack
 */

import { lookupSchemaNode, validateNavigationSegment } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeScope(state: VMState, command: Command): CommandError[] | null {
	const segments = command.pathSegments || [];
	const errors: CommandError[] = [];

	for (const segment of segments) {
		if (segment) {
			// Schema validation for navigation
			if (state.schemaRoot) {
				const currentPath = state.scopeStack.join('.');
				const currentNode = currentPath ? lookupSchemaNode(state.schemaRoot, state.scopeStack) : state.schemaRoot;

				if (currentNode) {
					const navError = validateNavigationSegment(currentNode, segment);
					if (navError) {
						const fullPath = currentPath ? `${currentPath}.${segment}` : segment;
						errors.push({
							message: navError,
							kind: 'schema',
							path: fullPath,
						});
					}
				}
			}

			state.scopeStack.push(segment);
		}
	}

	return errors.length > 0 ? errors : null;
}
