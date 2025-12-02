/**
 * Rescope command - replaces the entire scope stack with new path segments
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeRescope(state: VMState, command: Command): CommandError[] | null {
	// Clear the scope stack
	state.scopeStack.length = 0;

	// Push new segments with schema validation
	const segments = command.pathSegments || [];
	const errors = validateAndPushSegments(state, segments);
	return errors.length > 0 ? errors : null;
}
