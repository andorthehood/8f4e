import { normalizeArgument } from './normalizeArgument';

import type { AST } from '@8f4e/tokenizer';
import type { SymbolResolutionContext } from '../types';

export function normalizeArgumentsAtIndexes(
	line: AST[number],
	context: SymbolResolutionContext,
	indexes: number[]
): { line: AST[number]; changed: boolean } {
	let changed = false;
	const nextArguments = line.arguments.map((argument, index) => {
		if (!indexes.includes(index)) {
			return argument;
		}

		const normalized = normalizeArgument(argument, context);
		if (normalized !== argument) {
			changed = true;
		}
		return normalized;
	});

	return { line: changed ? { ...line, arguments: nextArguments } : line, changed };
}
