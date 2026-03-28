import { isIntermodularReference } from '@8f4e/tokenizer';

import { ErrorCode, getError } from '../../compilerError';
import { ArgumentType, type AST, type CompilationContext } from '../../types';
import resolveIntermodularReferenceValue from '../../utils/resolveIntermodularReferenceValue';

export default function semanticInit(line: AST[number], context: CompilationContext) {
	const targetIdentifier = (line.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string }).value;
	const defaultArg = line.arguments[1] as
		| { type: ArgumentType.LITERAL; value: number }
		| { type: ArgumentType.IDENTIFIER; value: string };
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
	} else if (isIntermodularReference(defaultArg.value)) {
		defaultValue = resolveIntermodularReferenceValue(defaultArg.value, line, context) ?? 0;
	} else {
		const intermodularValue = resolveIntermodularReferenceValue(defaultArg.value, line, context);
		if (typeof intermodularValue === 'number') {
			defaultValue = intermodularValue;
		} else if (defaultArg.value[0] === '&') {
			const referencedMemoryItem = context.namespace.memory[defaultArg.value.substring(1)];

			if (!referencedMemoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: defaultArg.value.substring(1),
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
