import type {
	CompilationContext,
	MemoryLayoutPlan,
	MemoryPointerMetadata,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
	ResolvedMemoryDeclaration,
} from '@8f4e/language-spec';

/** Creates an empty memory plan for contexts that do not compile module memory. */
export function createEmptyMemoryPlan(): MemoryLayoutPlan {
	return {
		modules: {},
		moduleList: [],
		nextByteAddressByMemoryIndex: {},
	};
}

/** Returns the active module plan for contexts compiling a module body. */
export function getCurrentPlannedModule(context: CompilationContext): PlannedMemoryModule | undefined {
	return context.currentPlannedModule;
}

/** Returns the planned memory declaration for a local or explicitly targeted module. */
export function getPlannedMemoryDeclaration(
	context: CompilationContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
): PlannedMemoryDeclaration | undefined {
	const currentModule = getCurrentPlannedModule(context);
	const module = !moduleId || moduleId === currentModule?.id ? currentModule : context.memoryPlan.modules[moduleId];
	return module?.memory[memoryId];
}

function getPointerMetadataWithDefinedFields(metadata: MemoryPointerMetadata | undefined): MemoryPointerMetadata {
	return {
		...(metadata?.pointeeMemoryIndex !== undefined ? { pointeeMemoryIndex: metadata.pointeeMemoryIndex } : {}),
		...(metadata?.pointeeMemoryRegionName ? { pointeeMemoryRegionName: metadata.pointeeMemoryRegionName } : {}),
		...(metadata?.pointeeElementCount !== undefined ? { pointeeElementCount: metadata.pointeeElementCount } : {}),
	};
}

function createResolvedMemoryDeclaration(
	declaration: PlannedMemoryDeclaration,
	pointerMetadata: Record<string, MemoryPointerMetadata>
): ResolvedMemoryDeclaration {
	return {
		...declaration,
		...getPointerMetadataWithDefinedFields(pointerMetadata[declaration.id]),
	};
}

function getResolvedPointerMetadata(
	context: CompilationContext,
	moduleId = context.namespace.moduleName
): Record<string, MemoryPointerMetadata> {
	if (!moduleId || moduleId === context.namespace.moduleName) {
		return context.pointerMetadata;
	}

	return context.namespace.namespaces[moduleId].pointerMetadata;
}

/** Returns a resolved memory declaration for the active module, or for a target module namespace. */
export function getResolvedMemoryDeclaration(
	context: CompilationContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
): ResolvedMemoryDeclaration | undefined {
	const declaration = getPlannedMemoryDeclaration(context, memoryId, moduleId);
	if (!declaration) {
		return undefined;
	}

	return createResolvedMemoryDeclaration(declaration, getResolvedPointerMetadata(context, moduleId));
}
