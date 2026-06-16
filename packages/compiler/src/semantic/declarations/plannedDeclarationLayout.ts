import type { CompilationContext, PlannedMemoryDeclaration } from '@8f4e/compiler-spec';
import { getCurrentPlannedModule } from '../memoryState';

interface PlannedDeclarationLayout {
	declaration: PlannedMemoryDeclaration;
	nextLocalWordOffset: number;
}

/** Consumes the next declaration layout from the module memory plan. */
export default function consumePlannedDeclarationLayout(context: CompilationContext): PlannedDeclarationLayout {
	const declarationIndex = context.currentPlannedMemoryDeclarationIndex;
	const declaration = getCurrentPlannedModule(context)!.declarations[declarationIndex];
	context.currentPlannedMemoryDeclarationIndex = declarationIndex + 1;

	return {
		declaration,
		nextLocalWordOffset: context.currentModuleNextWordOffset + declaration.wordAlignedSize,
	};
}
