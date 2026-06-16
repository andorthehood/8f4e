import type {
	CompilationContext,
	MemoryLayoutPlan,
	MemoryPointerMetadata,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
	ResolvedMemoryDeclaration,
} from '@8f4e/language-spec';

type MemoryPlanContext = Pick<CompilationContext, 'currentPlannedModule' | 'memoryPlan' | 'namespace'>;

export function createEmptyMemoryPlan(): MemoryLayoutPlan {
	return {
		modules: {},
		moduleList: [],
		nextByteAddressByMemoryIndex: {},
	};
}

export function getCurrentPlannedModule(context: MemoryPlanContext): PlannedMemoryModule | undefined {
	return (
		context.currentPlannedModule ??
		(context.namespace.moduleName ? context.memoryPlan.modules[context.namespace.moduleName] : undefined)
	);
}

export function getPlannedMemoryDeclaration(
	context: MemoryPlanContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
): PlannedMemoryDeclaration | undefined {
	const currentModule = getCurrentPlannedModule(context);
	const module = !moduleId || moduleId === currentModule?.id ? currentModule : context.memoryPlan.modules[moduleId];
	return module?.memory[memoryId];
}

interface ResolvedMemoryOverlay {
	pointerMetadata: Record<string, MemoryPointerMetadata>;
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
	overlay: ResolvedMemoryOverlay
): ResolvedMemoryDeclaration {
	return {
		...declaration,
		...getPointerMetadataWithDefinedFields(overlay.pointerMetadata[declaration.id]),
	};
}

function getResolvedMemoryOverlay(
	context: CompilationContext,
	moduleId = context.namespace.moduleName
): ResolvedMemoryOverlay {
	if (!moduleId || moduleId === context.namespace.moduleName) {
		return context;
	}

	return context.namespace.namespaces[moduleId];
}

export function getResolvedMemoryDeclaration(
	context: CompilationContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
): ResolvedMemoryDeclaration | undefined {
	const declaration = getPlannedMemoryDeclaration(context, memoryId, moduleId);
	if (!declaration) {
		return undefined;
	}

	return createResolvedMemoryDeclaration(declaration, getResolvedMemoryOverlay(context, moduleId));
}
