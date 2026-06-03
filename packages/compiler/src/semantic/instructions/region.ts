import type { CompilationContext, RegionLine } from '@8f4e/compiler-spec';

import { resolveRegionDirective } from '../memoryRegions';

/**
 * Applies the `#region` directive to switch the active memory region for subsequent declarations.
 *
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 */
export default function semanticRegion(line: RegionLine, context: CompilationContext) {
	const region = resolveRegionDirective(line, context);
	context.currentMemoryIndex = region.memoryIndex;
	if (region.memoryRegionName) {
		context.currentMemoryRegionName = region.memoryRegionName;
	} else {
		delete context.currentMemoryRegionName;
	}
}
