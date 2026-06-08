import { type CompilationContext, ErrorCode, type ShapeLine } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';
import { applyMemoryDeclarationLine } from '../declarations';
import normalizeCompileTimeArguments from '../normalizeCompileTimeArguments';

/**
 * Expands a prototype `shape` instruction into semantic memory declarations.
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

	if (!context.expandPrototypeShapes) {
		return;
	}

	const prototype = context.prototypeShapes?.[prototypeId];
	if (!prototype) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: prototypeId });
	}

	context.isInherited = true;
	for (const declarationLine of prototype.memoryDeclarationLines) {
		const inheritedDeclarationLine = {
			...declarationLine,
			lineNumber: line.lineNumber,
		};
		const resolvedDeclarationLine =
			context.resolveMemoryDeclarationLine?.(inheritedDeclarationLine) ?? inheritedDeclarationLine;
		applyMemoryDeclarationLine(normalizeCompileTimeArguments(resolvedDeclarationLine, context), context);
	}
	context.isInherited = false;
}
