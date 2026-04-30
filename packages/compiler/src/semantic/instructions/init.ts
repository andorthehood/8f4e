import { ArgumentType, type CompilationContext, type NormalizedInitLine } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../../compilerError';

export default function semanticInit(line: NormalizedInitLine, context: CompilationContext) {
	const targetIdentifier = line.arguments[0].value;
	const defaultArg = line.arguments[1];
	const indexedTargetMatch = targetIdentifier.match(/(\S+)\[(\d+)\]/);
	const targetMemoryId = indexedTargetMatch ? indexedTargetMatch[1] : targetIdentifier;
	const memoryItem = context.namespace.memory[targetMemoryId];

	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
			identifier: targetMemoryId,
		});
	}

	let defaultValue = 0;

	if (defaultArg.type === ArgumentType.LITERAL) {
		defaultValue = defaultArg.value;
	} else if (defaultArg.type === ArgumentType.IDENTIFIER) {
		if (defaultArg.referenceKind === 'memory-reference' && !defaultArg.isEndAddress) {
			const referencedMemoryItem = context.namespace.memory[defaultArg.targetMemoryId];

			if (!referencedMemoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: defaultArg.targetMemoryId,
				});
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
