import type { CompilationContext, ShapeLine } from '@8f4e/language-spec';

/**
 * Records a prototype `shape` instruction for the active module.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export default function semanticShape(line: ShapeLine, context: CompilationContext) {
	const prototypeId = line.arguments[0].value;
	if (!context.namespace.prototypeShapeIds.includes(prototypeId)) {
		context.namespace.prototypeShapeIds.push(prototypeId);
	}
}
