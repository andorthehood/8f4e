/**
 * Push command - pushes a literal value onto the data stack
 */

import type { Command, Literal, VMState } from '../types';

export default function executePush(state: VMState, command: Command): string | null {
	state.dataStack.push(command.argument as Literal);
	return null;
}
