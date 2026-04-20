import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { getReferencedNamespaceIdsFromArgument } from './getReferencedNamespaceIdsFromArgument';

export function getDeferredNamespaceIds(line: AST[number]): string[] {
	if (line.instruction === 'use') {
		return [(line.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string }).value];
	}

	return line.arguments.flatMap(argument => getReferencedNamespaceIdsFromArgument(argument));
}
