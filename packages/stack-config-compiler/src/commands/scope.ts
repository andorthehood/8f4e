/**
 * Scope command - pushes path segments onto the scope stack
 */

import type { Command, VMState } from '../types';

export function executeScope(state: VMState, command: Command): string | null {
	const segments = command.pathSegments || [];
	for (const segment of segments) {
		if (segment) {
			state.scopeStack.push(segment);
		}
	}
	return null;
}
