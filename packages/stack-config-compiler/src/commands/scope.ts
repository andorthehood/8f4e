/**
 * Scope command - pushes path segments onto the scope stack
 */

import { validateAndPushSegments } from '../schema';

import type { Command, VMState } from '../types';
import type { CommandError } from '../vm/executeCommand';

export function executeScope(state: VMState, command: Command): CommandError[] | null {
	const segments = command.pathSegments || [];
	const errors = validateAndPushSegments(state, segments);
	return errors.length > 0 ? errors : null;
}
