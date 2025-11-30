/**
 * Set command - pops values from the data stack and sets them at the current scope path
 */

import { getCurrentScope } from '../vm/getCurrentScope';
import { setAtPath } from '../vm/setAtPath';

import type { VMState } from '../types';

export function executeSet(state: VMState): string | null {
	const currentScope = getCurrentScope(state);

	if (!currentScope) {
		return 'Cannot set at root scope (scope stack is empty)';
	}

	if (state.dataStack.length === 0) {
		return 'Cannot set: data stack is empty';
	}

	// Pop all values from the stack
	const values = state.dataStack.splice(0, state.dataStack.length);

	// If exactly one value, use it directly; otherwise create an array
	const value = values.length === 1 ? values[0] : values;

	return setAtPath(state.config, currentScope, value);
}
