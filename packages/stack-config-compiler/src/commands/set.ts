/**
 * Set command - pops values from the data stack and sets them at the current scope path
 */

import { getCurrentScope } from '../vm/getCurrentScope';
import { setAtPath } from '../vm/setAtPath';
import { lookupSchemaNode, validateValue } from '../schema';

import type { VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeSet(state: VMState): CommandError[] | null {
	const currentScope = getCurrentScope(state);

	if (!currentScope) {
		return [{ message: 'Cannot set at root scope (scope stack is empty)', kind: 'exec' }];
	}

	if (state.dataStack.length === 0) {
		return [{ message: 'Cannot set: data stack is empty', kind: 'exec' }];
	}

	// Pop all values from the stack
	const values = state.dataStack.splice(0, state.dataStack.length);

	// If exactly one value, use it directly; otherwise create an array
	const value = values.length === 1 ? values[0] : values;

	const errors: CommandError[] = [];

	// Schema validation for value
	if (state.schemaRoot) {
		const schemaNode = lookupSchemaNode(state.schemaRoot, state.scopeStack);
		if (schemaNode) {
			const valueError = validateValue(schemaNode, value);
			if (valueError) {
				errors.push({
					message: valueError,
					kind: 'schema',
					path: currentScope,
				});
			}
		}

		// Track written path
		if (state.writtenPaths) {
			state.writtenPaths.add(currentScope);
		}
	}

	const setError = setAtPath(state.config, currentScope, value);
	if (setError) {
		errors.push({ message: setError, kind: 'exec' });
	}

	return errors.length > 0 ? errors : null;
}
