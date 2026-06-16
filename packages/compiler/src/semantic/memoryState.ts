import type {
	CompilationContext,
	DataStructure,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryMap,
	MemoryPointerMetadata,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
} from '@8f4e/compiler-spec';

type MemoryPlanContext = Pick<CompilationContext, 'currentPlannedModule' | 'memoryPlan' | 'namespace'>;

/** Creates an empty memory plan for contexts that do not compile module memory. */
export function createEmptyMemoryPlan(): MemoryLayoutPlan {
	return {
		modules: {},
		moduleList: [],
		nextByteAddressByMemoryIndex: {},
	};
}

/** Returns the active module plan for contexts compiling a module body. */
export function getCurrentPlannedModule(context: MemoryPlanContext): PlannedMemoryModule | undefined {
	return (
		context.currentPlannedModule ??
		(context.namespace.moduleName ? context.memoryPlan.modules[context.namespace.moduleName] : undefined)
	);
}

/** Returns the planned memory declaration for a local or explicitly targeted module. */
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
	memoryDefaults: MemoryDefaults;
	pointerMetadata: Record<string, MemoryPointerMetadata>;
}

function getPointerMetadataWithDefinedFields(metadata: MemoryPointerMetadata | undefined): MemoryPointerMetadata {
	return {
		...(metadata?.pointeeMemoryIndex !== undefined ? { pointeeMemoryIndex: metadata.pointeeMemoryIndex } : {}),
		...(metadata?.pointeeMemoryRegionName ? { pointeeMemoryRegionName: metadata.pointeeMemoryRegionName } : {}),
		...(metadata?.pointeeElementCount !== undefined ? { pointeeElementCount: metadata.pointeeElementCount } : {}),
	};
}

/** Materializes the resolved declaration shape used by codegen and public compiler output. */
export function createMemoryItem(declaration: PlannedMemoryDeclaration, overlay: ResolvedMemoryOverlay): DataStructure {
	const memoryDefault = overlay.memoryDefaults[declaration.id]!;
	const pointerMetadata = getPointerMetadataWithDefinedFields(overlay.pointerMetadata[declaration.id]);

	return {
		...declaration,
		default: memoryDefault.value,
		hasExplicitDefault: memoryDefault.hasExplicitDefault === true,
		isInherited: memoryDefault.isInherited,
		...pointerMetadata,
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

/** Returns a resolved memory item for the active module, or for a target module namespace. */
export function getMemoryItem(
	context: CompilationContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
): DataStructure | undefined {
	const declaration = getPlannedMemoryDeclaration(context, memoryId, moduleId);
	if (!declaration) {
		return undefined;
	}

	return createMemoryItem(declaration, getResolvedMemoryOverlay(context, moduleId));
}

/** Materializes a module's resolved memory map for compiler output and memory initialization. */
export function createMemoryMapFromPlan(module: PlannedMemoryModule, overlay: ResolvedMemoryOverlay): MemoryMap {
	return Object.fromEntries(
		Object.entries(module.memory).map(([id, declaration]) => [id, createMemoryItem(declaration, overlay)])
	) as MemoryMap;
}
