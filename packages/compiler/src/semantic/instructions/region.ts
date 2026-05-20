import { type CompilationContext, type RegionLine } from '@8f4e/compiler-spec';

import { resolveRegionDirective } from '../memoryRegions';

export default function semanticRegion(line: RegionLine, context: CompilationContext) {
	const region = resolveRegionDirective(line, context);
	context.currentMemoryIndex = region.memoryIndex;
	if (region.memoryRegionName) {
		context.currentMemoryRegionName = region.memoryRegionName;
	} else {
		delete context.currentMemoryRegionName;
	}
}
