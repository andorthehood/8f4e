import type { CompilationContext, MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { ArgumentType, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { type MemoryLayoutSourceModule, type PlannedMemoryDeclaration, planMemoryLayout } from '@8f4e/memory-planner';

interface PlannedDeclarationLayout {
	declaration: PlannedMemoryDeclaration;
	nextLocalWordOffset: number;
}

function createSingleDeclarationModule(
	line: MemoryDeclarationLine,
	context: CompilationContext
): MemoryLayoutSourceModule {
	const moduleId = context.namespace.moduleName ?? 'module';
	return {
		id: moduleId,
		moduleLine: {
			lineNumber: line.lineNumber,
		},
		regionLine: {
			arguments: [
				{
					type: ArgumentType.LITERAL,
					value: context.currentMemoryIndex,
					isInteger: true,
				},
			],
		},
		memoryDeclarationLines: [line],
	};
}

/** Plans one declaration at the context's current module offset. */
export default function planDeclarationLayout(
	line: MemoryDeclarationLine,
	context: CompilationContext
): PlannedDeclarationLayout {
	const declarationStartByteAddress =
		context.startingByteAddress + context.currentModuleNextWordOffset * GLOBAL_ALIGNMENT_BOUNDARY;
	const plan = planMemoryLayout({
		asts: [createSingleDeclarationModule(line, context)],
		startingByteAddress: declarationStartByteAddress,
		memoryRegions: context.memoryRegions,
	});
	const [modulePlan] = plan.moduleList;
	const [declaration] = modulePlan.declarations;

	return {
		declaration,
		nextLocalWordOffset: context.currentModuleNextWordOffset + modulePlan.wordAlignedSize,
	};
}
