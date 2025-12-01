/**
 * RescopeTop command - replaces the top scope segment with new path segments
 */

import { validateNavigation } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeRescopeTop(state: VMState, command: Command): CommandError[] | null {
	if (state.scopeStack.length === 0) {
		return [{ message: 'Cannot rescopeTop: scope stack is empty', kind: 'exec' }];
	}

	// Pop the top segment
	state.scopeStack.pop();

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
