import { type CompilationContext, type NormalizedConstLine } from '@8f4e/compiler-types';

/**
 * Applies a fully normalized `const` declaration to the compilation context.
 *
 * This is the sole owner of all writes to `context.namespace.consts`. It is
 * invoked via applySemanticInstruction, which is reached through two paths:
 *
 * 1. Namespace prepass (prepassNamespace → applySemanticLine): runs normalize + this function
 *    for every const line to populate the local namespace before codegen.
 * 2. Module/function compilation (compileLine → applySemanticLine): same path, allowing
 *    functions to declare their own const-scoped names during their compilation pass.
 *
 * `use` then imports consts from other modules' validated namespaces by merging into
 * `context.namespace.consts`; it never creates or validates const values itself, only
 * copies already-resolved literals from a validated namespace.
 */
export default function semanticConst(line: NormalizedConstLine, context: CompilationContext) {
	const constName = line.arguments[0].value;
	const constValue = line.arguments[1];
	context.namespace.consts[constName] = {
		value: constValue.value,
		isInteger: constValue.isInteger,
		...(constValue.isFloat64 ? { isFloat64: true } : {}),
	};
}
