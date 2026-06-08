import type { CompilationContext, ResolvedPushShapeLine, Stack } from '@8f4e/compiler-spec';
import { analyzePush } from './push';

/**
 * Produces stack items for every address push expanded from a `pushShape` line.
 *
 * @param line - Resolved pushShape line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The produced stack items.
 */
export function analyzePushShape(line: ResolvedPushShapeLine, context: CompilationContext): Stack {
	return line.shapeAddressPushes.flatMap(pushLine => analyzePush(pushLine, context));
}
