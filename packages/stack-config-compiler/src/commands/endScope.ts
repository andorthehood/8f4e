/**
 * EndScope command - pops one segment from the scope stack
 */

import type { VMState } from '../types';

export function executeEndScope(state: VMState): string | null {
	if (state.scopeStack.length === 0) {
		return 'Cannot endScope: scope stack is empty';
	}
	state.scopeStack.pop();
	return null;
}
