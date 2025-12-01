/**
 * Rescope command - replaces the entire scope stack with new path segments
 */

import { validateNavigation } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeRescope(state: VMState, command: Command): CommandError[] | null {
	// Clear the scope stack
	state.scopeStack.length = 0;

	// Push new segments with schema validation
	const segments = command.pathSegments || [];
	const errors: CommandError[] = [];

	for (const segment of segments) {
		if (segment) {
			// Schema validation for navigation
			if (state.schemaRoot) {
				const navError = validateNavigation(state.schemaRoot, state.scopeStack, segment);
				if (navError) {
					errors.push({
						message: navError.message,
						kind: 'schema',
						path: navError.path,
					});
				}
			}

			state.scopeStack.push(segment);
		}
	}

	return errors.length > 0 ? errors : null;
}
