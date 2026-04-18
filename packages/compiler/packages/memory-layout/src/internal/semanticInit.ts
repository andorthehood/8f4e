import { ArgumentType, type InitLine } from '@8f4e/tokenizer';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../types';

export function semanticInit(line: InitLine, context: PublicMemoryLayoutContext) {
	const targetIdentifier = line.arguments[0].value;
	const defaultArg = line.arguments[1];
	const indexedTargetMatch = targetIdentifier.match(/(\S+)\[(\d+)\]/);
	const targetMemoryId = indexedTargetMatch ? indexedTargetMatch[1] : targetIdentifier;
	const memoryItem = context.namespace.memory[targetMemoryId];

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
	}

	let defaultValue = 0;

	if (defaultArg.type === ArgumentType.LITERAL) {
		defaultValue = defaultArg.value;
	} else if (defaultArg.type === ArgumentType.IDENTIFIER) {
		if (defaultArg.referenceKind === 'memory-reference' && !defaultArg.isEndAddress) {
			const referencedMemoryItem = context.namespace.memory[defaultArg.targetMemoryId];
			if (!referencedMemoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: defaultArg.targetMemoryId });
			}
			defaultValue = referencedMemoryItem.byteAddress;
		} else {
			return;
		}
	}

	if (indexedTargetMatch) {
		const [, memoryIdentifier, offset] = indexedTargetMatch as [never, string, string];
		const bufferMemoryItem = context.namespace.memory[memoryIdentifier];
		if (bufferMemoryItem && typeof bufferMemoryItem.default === 'object') {
			bufferMemoryItem.default[offset] = defaultValue;
		}
		return;
	}

	memoryItem.default = defaultValue;
}
