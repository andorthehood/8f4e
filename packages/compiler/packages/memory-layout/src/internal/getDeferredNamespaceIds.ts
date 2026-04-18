import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { getReferencedNamespaceIdsFromArgument } from './getReferencedNamespaceIdsFromArgument';

export function getDeferredNamespaceIds(line: AST[number]): string[] {
	if (line.instruction === 'use' && line.arguments[0]?.type === ArgumentType.IDENTIFIER) {
		return [line.arguments[0].value];
	}

	return line.arguments.flatMap(argument => getReferencedNamespaceIdsFromArgument(argument));
}
