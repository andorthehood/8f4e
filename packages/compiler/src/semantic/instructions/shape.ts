import { type CompilationContext, ErrorCode, type ShapeLine } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';
import { applyMemoryDeclarationLine } from '../declarations';
import normalizeCompileTimeArguments from '../normalizeCompileTimeArguments';

export default function semanticShape(line: ShapeLine, context: CompilationContext) {
	if (!context.expandPrototypeShapes) {
		return;
	}

	const prototypeId = line.arguments[0].value;
	const prototype = context.prototypeShapes?.[prototypeId];
	if (!prototype) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: prototypeId });
	}

	for (const declarationLine of prototype.memoryDeclarationLines) {
		const resolvedDeclarationLine = context.resolveMemoryDeclarationLine?.(declarationLine) ?? declarationLine;
		applyMemoryDeclarationLine(normalizeCompileTimeArguments(resolvedDeclarationLine, context), context);
	}
}
