/**
 * RescopeSuffix command - replaces the trailing suffix of the scope stack with new path segments
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeRescopeSuffix(state: VMState, command: Command): CommandError[] | null {
	const segments = command.pathSegments || [];

	if (state.scopeStack.length < segments.length) {
		return [
			{
				message: `Cannot rescopeSuffix: scope stack has ${state.scopeStack.length} segment(s), but suffix has ${segments.length} segment(s)`,
				kind: 'exec',
			},
		];
	}

	// Pop the last n segments
	state.scopeStack.splice(-segments.length);

	// Push new segments with schema validation
	const errors = validateAndPushSegments(state, segments);
	return errors.length > 0 ? errors : null;
}
