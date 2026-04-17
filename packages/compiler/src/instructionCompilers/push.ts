import pushLiteral from './push/handlers/pushLiteral';
import pushLocal from './push/handlers/pushLocal';
import pushMemoryIdentifier from './push/handlers/pushMemoryIdentifier';
import pushMemoryPointer from './push/handlers/pushMemoryPointer';
import pushStringLiteral from './push/handlers/pushStringLiteral';
import resolveIdentifierPushKind, { IdentifierPushKind } from './push/resolveIdentifierPushKind';

import { ArgumentType } from '../types';
import { withValidation } from '../withValidation';

import type { CodegenPushLine, InstructionCompiler, PushIdentifierLine } from '../types';

/**
 * Instruction compiler for `push`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const push: InstructionCompiler<CodegenPushLine> = withValidation<CodegenPushLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line: CodegenPushLine, context) => {
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
					return pushMemoryPointer(identifierLine, context);
				case IdentifierPushKind.LOCAL:
				default:
					return pushLocal(identifierLine, context);
			}
		}

		return pushLiteral(argument, context);
	}
);

export default push;
