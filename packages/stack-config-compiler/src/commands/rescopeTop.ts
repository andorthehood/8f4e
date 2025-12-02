/**
 * RescopeTop command - replaces the top scope segment with new path segments
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeRescopeTop(state: VMState, command: Command): CommandError[] | null {
	if (state.scopeStack.length === 0) {
		return [{ message: 'Cannot rescopeTop: scope stack is empty', kind: 'exec' }];
	}

	state.scopeStack.pop();

	const segments = command.pathSegments || [];
	const errors = validateAndPushSegments(state, segments);
	return errors.length > 0 ? errors : null;
}
