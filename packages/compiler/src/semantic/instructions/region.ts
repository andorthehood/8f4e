import type { CompilationContext, RegionLine } from '@8f4e/compiler-spec';
import { resolveRegionDirective } from '@8f4e/compiler-spec';

/**
 * Applies the `#region` directive to switch the active memory region for subsequent declarations.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
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
