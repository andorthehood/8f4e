import { type CompilationContext, type UseLine } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../../compilerError';

/**
 * Applies a `use` instruction by importing all consts from the target namespace into
 * the current compilation context.
 *
 * `use` reads exclusively from validated namespace data produced by the namespace prepass.
 * It does not parse or validate const values itself; those are guaranteed to be literal
 * values already by the time the namespace is registered. Declaration order matters:
 * only consts imported by a `use` that appears before a subsequent `const` reference
 * are in scope for that reference.
 */
export default function semanticUse(line: UseLine, context: CompilationContext) {
	const namespaceId = line.arguments[0].value;
	const namespaceToUse = context.namespace.namespaces[namespaceId];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: namespaceId });
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };
}
