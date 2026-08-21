import type { CompilationContext, ResolvedPushShapeLine, Stack, StackAddress } from '@8f4e/language-spec';
import { functionValueTypeToStackItem } from '@8f4e/language-spec';
import { analyzePush } from './push';

/**
 * Produces stack items for every address push expanded from a `pushShape` line.
 *
 * @param line - Resolved pushShape line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The produced stack items.
 */
export function analyzePushShape(line: ResolvedPushShapeLine, context: CompilationContext): Stack {
	const producedStack: Stack = [];

	for (const { pushLine, pointerType } of line.shapeExpansions) {
		const produced = analyzePush(pushLine, context) as StackAddress[];
		const pointer = functionValueTypeToStackItem(pointerType) as StackAddress;

		for (const item of produced) {
			item.pointsTo = {
				...pointer.pointsTo!,
				memoryIndex: item.address.memoryIndex,
				...(item.address.memoryRegionName ? { memoryRegionName: item.address.memoryRegionName } : {}),
			};
		}

		producedStack.push(...produced);
	}

	return producedStack;
}
