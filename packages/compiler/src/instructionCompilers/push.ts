import { ArgumentType } from '@8f4e/compiler-spec';

import pushLiteral from './push/handlers/pushLiteral';
import pushLocal from './push/handlers/pushLocal';
import pushLocalPointer from './push/handlers/pushLocalPointer';
import pushMemoryIdentifier from './push/handlers/pushMemoryIdentifier';
import pushMemoryPointer from './push/handlers/pushMemoryPointer';
import pushStringLiteral from './push/handlers/pushStringLiteral';
import resolveIdentifierPushKind, { IdentifierPushKind } from './push/resolveIdentifierPushKind';

import type {
	CodegenPushLine,
	InstructionCompiler,
	MemoryPointerPushLine,
	PushIdentifierLine,
} from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `push`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const push: InstructionCompiler<CodegenPushLine> = (line: CodegenPushLine, context) => {
	const argument = line.arguments[0];

	if (argument.type === ArgumentType.STRING_LITERAL) {
		return pushStringLiteral(argument, context);
	}

	if (argument.type === ArgumentType.IDENTIFIER) {
		const identifierLine = line as PushIdentifierLine;

		switch (resolveIdentifierPushKind(context.namespace, context.locals, argument)) {
			case IdentifierPushKind.MEMORY_IDENTIFIER:
				return pushMemoryIdentifier(identifierLine, context);
			case IdentifierPushKind.MEMORY_POINTER:
				return pushMemoryPointer(identifierLine as MemoryPointerPushLine, context);
			case IdentifierPushKind.LOCAL_POINTER:
				return pushLocalPointer(identifierLine as MemoryPointerPushLine, context);
			case IdentifierPushKind.LOCAL:
			default:
				return pushLocal(identifierLine, context);
		}
	}

	return pushLiteral(argument, context);
};

export default push;
