import { ArgumentType, type Argument } from '@8f4e/tokenizer';

export function getReferencedNamespaceIdsFromArgument(argument: Argument | undefined): string[] {
	if (!argument) {
		return [];
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return [...argument.intermoduleIds];
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return [];
	}

	if (argument.scope !== 'intermodule' || !argument.targetModuleId) {
		return [];
	}
	return [argument.targetModuleId];
}
