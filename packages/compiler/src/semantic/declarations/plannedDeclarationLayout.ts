import type { CompilationContext, MemoryLayoutDeclaration } from '@8f4e/compiler-spec';

interface PlannedDeclarationLayout {
	declaration: MemoryLayoutDeclaration;
	nextLocalWordOffset: number;
}

/** Consumes the next declaration layout from the module memory plan. */
export default function consumePlannedDeclarationLayout(context: CompilationContext): PlannedDeclarationLayout {
	const declarationIndex = context.currentMemoryLayoutDeclarationIndex ?? 0;
	const declaration = context.memoryLayoutDeclarations![declarationIndex];
	context.currentMemoryLayoutDeclarationIndex = declarationIndex + 1;

	return {
		declaration,
		nextLocalWordOffset: context.currentModuleNextWordOffset + declaration.wordAlignedSize,
	};
}
