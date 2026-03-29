import { ErrorCode, getError } from '../../compilerError';
import { type CompilationContext, type UseLine } from '../../types';

export default function semanticUse(line: UseLine, context: CompilationContext) {
	const namespaceId = line.arguments[0].value;
	const namespaceToUse = context.namespace.namespaces[namespaceId];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: namespaceId });
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };
}
