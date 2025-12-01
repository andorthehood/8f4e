/**
 * Rescope command - replaces the entire scope stack with new path segments
 */

import type { Command, VMState } from '../types';

export function executeRescope(state: VMState, command: Command): string | null {
	state.scopeStack.length = 0;

	const segments = command.pathSegments || [];
	for (const segment of segments) {
		if (segment) {
			state.scopeStack.push(segment);
		}
	}
	return null;
}
