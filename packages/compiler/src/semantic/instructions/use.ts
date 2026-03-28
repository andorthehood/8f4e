import { ErrorCode, getError } from '../../compilerError';
import { ArgumentType, type AST, type CompilationContext } from '../../types';

export default function semanticUse(line: AST[number], context: CompilationContext) {
	const namespaceId = (line.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string }).value;
	const namespaceToUse = context.namespace.namespaces[namespaceId];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: namespaceId });
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };
}
