import { ArgumentType, BlockType } from '@8f4e/compiler-spec';

import { normalizeAndValidateResolvableArgs } from './helpers';

import type { CompilationContext, MapLine, NormalizedMapLine, NormalizedArgumentLiteral } from '@8f4e/compiler-spec';

function createImplicitKeyArgument(context: CompilationContext): NormalizedArgumentLiteral {
	const block = context.blockStack[context.blockStack.length - 1];
	const mapState = block?.blockType === BlockType.MAP ? block.mapState : undefined;

	return {
		type: ArgumentType.LITERAL,
		value: mapState?.rows.length ?? 0,
		isInteger: !!mapState?.inputIsInteger,
		...(mapState?.inputIsFloat64 ? { isFloat64: true } : {}),
	};
}

function isInsideMapBlock(context: CompilationContext): boolean {
	const block = context.blockStack[context.blockStack.length - 1];

	return block?.blockType === BlockType.MAP;
}

/**
 * Normalizes compile-time arguments for the `map` instruction.
 * Two-argument rows normalize both key and value. One-argument rows use the
 * current zero-based map row count as the implicit key and normalize the lone
 * argument as the value.
 */
export default function normalizeMap(line: MapLine, context: CompilationContext): NormalizedMapLine | MapLine {
	if (line.arguments.length === 1) {
		if (!isInsideMapBlock(context)) {
			return line;
		}

		const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);

		return {
			...normalized,
			arguments: [createImplicitKeyArgument(context), normalized.arguments[0]],
		} as NormalizedMapLine;
	}

	const normalized = normalizeAndValidateResolvableArgs(line, context, [0, 1]);

	return normalized as NormalizedMapLine;
}
