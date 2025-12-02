/**
 * Append command - appends values from the data stack to an array at the current scope path
 */

import { appendAtPath } from '../vm/appendAtPath';
import { getCurrentScope } from '../vm/getCurrentScope';
import { lookupSchemaNode, validateValue } from '../schema';

import type { VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeAppend(state: VMState): CommandError[] | null {
	const currentScope = getCurrentScope(state);

	if (!currentScope) {
		return [{ message: 'Cannot append at root scope (scope stack is empty)', kind: 'exec' }];
	}

	if (state.dataStack.length === 0) {
		return [{ message: 'Cannot append: data stack is empty', kind: 'exec' }];
	}

	// Pop all values from the stack and append each one
	const values = state.dataStack.splice(0, state.dataStack.length);
	const errors: CommandError[] = [];

	// Schema validation for the path being an array
	if (state.schemaRoot) {
		const schemaNode = lookupSchemaNode(state.schemaRoot, state.scopeStack);
		if (schemaNode && !schemaNode.isArray && schemaNode.types.size > 0 && !schemaNode.types.has('array')) {
			errors.push({
				message: `Cannot append to non-array path "${currentScope}"`,
				kind: 'schema',
				path: currentScope,
			});
		}

		// Validate each value against item schema if available
		if (schemaNode?.itemSchema) {
			for (const val of values) {
				const valueError = validateValue(schemaNode.itemSchema, val);
				if (valueError) {
					errors.push({
						message: valueError,
						kind: 'schema',
						path: currentScope,
					});
				}
			}
		}

		// Track written path
		if (state.writtenPaths) {
			state.writtenPaths.add(currentScope);
		}
	}

	for (const val of values) {
		const error = appendAtPath(state.config, currentScope, val);
		if (error) {
			errors.push({ message: error, kind: 'exec' });
		}
	}

	return errors.length > 0 ? errors : null;
}
