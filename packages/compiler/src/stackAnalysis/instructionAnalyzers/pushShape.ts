import type { CompilationContext, ResolvedPushShapeLine, Stack, StackAddress } from '@8f4e/compiler-spec';
import { functionValueTypeToStackItem } from '../../utils/functionValueType';
import { analyzePush } from './push';

/**
 * Produces stack items for every address push expanded from a `pushShape` line.
 *
 * @param line - Resolved pushShape line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The produced stack items.
 */
export function analyzePushShape(line: ResolvedPushShapeLine, context: CompilationContext): Stack {
	return line.shapeExpansions.flatMap(({ pushLine, pointerType }) => {
		const produced = analyzePush(pushLine, context) as StackAddress[];
		const pointer = functionValueTypeToStackItem(pointerType) as StackAddress;

		for (const item of produced) {
			item.pointsTo = {
				...pointer.pointsTo!,
				memoryIndex: item.address.memoryIndex,
				...(item.address.memoryRegionName ? { memoryRegionName: item.address.memoryRegionName } : {}),
			};
		}

		return produced;
	});
}
