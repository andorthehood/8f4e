import type { CompilationContext, ResolvedPushShapeLine, Stack } from '@8f4e/compiler-spec';
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
	return line.shapeAddressPushes.flatMap((pushLine, index) => {
		const produced = analyzePush(pushLine, context);
		const pointer = functionValueTypeToStackItem(line.shapePointerTypes[index]);
		if (pointer.kind !== 'address' || !pointer.pointsTo) {
			return produced;
		}

		for (const item of produced) {
			if (item.kind === 'address') {
				item.pointsTo = {
					...pointer.pointsTo,
					memoryIndex: item.address.memoryIndex,
					...(item.address.memoryRegionName ? { memoryRegionName: item.address.memoryRegionName } : {}),
				};
			}
		}

		return produced;
	});
}
