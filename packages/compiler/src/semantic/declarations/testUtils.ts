import type { CompilationContext, MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { planMemoryLayout } from '@8f4e/memory-planner';
import type { MemoryDeclarationCompiler } from './createDeclarationCompiler';

/** Seeds a declaration compiler test context with a memory plan for the declarations under test. */
export function prepareMemoryDeclarationPlan(
	context: CompilationContext,
	memoryDeclarationLines: readonly MemoryDeclarationLine[]
): void {
	const plan = planMemoryLayout({
		modules: [
			{
				id: context.namespace.moduleName ?? 'test',
				moduleLine: { lineNumber: memoryDeclarationLines[0]?.lineNumber ?? 0 },
				memoryDeclarationLines,
			},
		],
		startingByteAddress: context.startingByteAddress,
		memoryRegions: context.memoryRegions,
	});
	const [modulePlan] = plan.moduleList;
	context.memoryLayoutDeclarations = modulePlan.declarations;
	context.currentMemoryLayoutDeclarationIndex = 0;
	context.currentModuleWordAlignedSize = modulePlan.wordAlignedSize;
}

/** Applies one declaration in tests after ensuring the context has planned layout data. */
export function applyPlannedMemoryDeclaration<TLine extends MemoryDeclarationLine>(
	compileDeclaration: MemoryDeclarationCompiler<TLine>,
	line: TLine,
	context: CompilationContext
): CompilationContext {
	if (!context.memoryLayoutDeclarations) {
		prepareMemoryDeclarationPlan(context, [line]);
	}
	return compileDeclaration(line, context);
}
