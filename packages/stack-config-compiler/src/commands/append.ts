/**
 * Append command - appends values from the data stack to an array at the current scope path
 */

import { appendAtPath } from '../vm/appendAtPath';
import { getCurrentScope } from '../vm/getCurrentScope';

import type { VMState } from '../types';

export function executeAppend(state: VMState): string | null {
	const currentScope = getCurrentScope(state);

	if (!currentScope) {
		return 'Cannot append at root scope (scope stack is empty)';
	}

	if (state.dataStack.length === 0) {
		return 'Cannot append: data stack is empty';
	}

	const values = state.dataStack.splice(0, state.dataStack.length);

	for (const val of values) {
		const error = appendAtPath(state.config, currentScope, val);
		if (error) {
			return error;
		}
	}
	return null;
}
