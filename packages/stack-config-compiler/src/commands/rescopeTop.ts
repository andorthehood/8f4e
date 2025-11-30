/**
 * RescopeTop command - replaces the top scope segment with new path segments
 */

import type { Command, VMState } from '../types';

export function executeRescopeTop(state: VMState, command: Command): string | null {
	if (state.scopeStack.length === 0) {
		return 'Cannot rescopeTop: scope stack is empty';
	}

	// Pop the top segment
	state.scopeStack.pop();

	// Push new segments
	const segments = command.pathSegments || [];
	for (const segment of segments) {
		if (segment) {
			state.scopeStack.push(segment);
		}
	}
	return null;
}
