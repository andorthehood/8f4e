import {
	ArgumentType,
	type CodegenPushLine,
	type CompilationContext,
	ErrorCode,
	type PushShapeLine,
	type ResolvedPushShapeLine,
} from '@8f4e/compiler-spec';
import { memoryStartAddressValue } from '@8f4e/memory-reference-inliner';
import { getError } from '../../compilerError';
import { getMemoryItem } from '../memoryState';
import { getParamType } from '../paramShape';
import { getPrototypeMemoryDeclarationId } from '../prototypeShapes';

function createAddressPushLine(line: PushShapeLine, memoryId: string, context: CompilationContext): CodegenPushLine {
	const address = memoryStartAddressValue(getMemoryItem(context, memoryId)!, context.namespace.moduleName);

	return {
		lineNumber: line.lineNumber,
		instruction: 'push',
		arguments: [
			{
				type: ArgumentType.LITERAL,
				value: address.value,
				isInteger: address.isInteger,
				...(address.address ? { address: address.address } : {}),
			},
		],
	};
}

/**
 * Normalizes `pushShape` into the explicit address pushes for the current module's effective shape memory.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Resolved pushShape line with codegen-ready address pushes.
 */
export default function normalizePushShape(line: PushShapeLine, context: CompilationContext): ResolvedPushShapeLine {
	const prototypeId = line.arguments[0].value;
	const prototype = context.prototypeShapes?.[prototypeId];
	if (!prototype) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: prototypeId });
	}

	if (!context.namespace.prototypeShapeIds.includes(prototypeId)) {
		throw getError(ErrorCode.PUSH_SHAPE_REQUIRES_MODULE_SHAPE, line, context, { identifier: prototypeId });
	}

	return {
		...line,
		shapeExpansions: prototype.memoryDeclarationLines.map(declarationLine => ({
			pushLine: createAddressPushLine(line, getPrototypeMemoryDeclarationId(declarationLine, line, context), context),
			pointerType: getParamType(declarationLine, line, context),
		})),
	};
}
