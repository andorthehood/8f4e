import type {
	CompilationContext,
	DataStructure,
	MemoryDefaultValue,
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
		(context.namespace.moduleName ? context.memoryPlan?.modules[context.namespace.moduleName] : undefined)
	);
}

/** Returns the planned memory declaration for a local or explicitly targeted module. */
export function getPlannedMemoryDeclaration(
	context: MemoryPlanContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
): PlannedMemoryDeclaration | undefined {
	const currentModule = getCurrentPlannedModule(context);
	const module = !moduleId || moduleId === currentModule?.id ? currentModule : context.memoryPlan?.modules[moduleId];
	return module?.memory[memoryId];
}

/** Records the resolved default state for one declaration in the active module. */
export function setMemoryDefault(
	context: CompilationContext,
	memoryId: string,
	value: MemoryDefaultValue,
	hasExplicitDefault?: boolean
): void {
	context.memoryDefaults[memoryId] = {
		value,
		hasExplicitDefault: hasExplicitDefault === true,
		isInherited: context.isInherited === true,
	};
}

/** Records pointer target metadata for one declaration in the active module. */
export function setPointerMetadata(
	context: CompilationContext,
	memoryId: string,
	metadata: MemoryPointerMetadata
): void {
	context.pointerMetadata[memoryId] = metadata;
}

function getPointerMetadataWithDefinedFields(metadata: MemoryPointerMetadata | undefined): MemoryPointerMetadata {
	return {
		...(metadata?.pointeeMemoryIndex !== undefined ? { pointeeMemoryIndex: metadata.pointeeMemoryIndex } : {}),
		...(metadata?.pointeeMemoryRegionName ? { pointeeMemoryRegionName: metadata.pointeeMemoryRegionName } : {}),
		...(metadata?.pointeeElementCount !== undefined ? { pointeeElementCount: metadata.pointeeElementCount } : {}),
	};
}

/** Materializes the resolved declaration shape used by codegen and public compiler output. */
export function createMemoryItem(
	declaration: PlannedMemoryDeclaration,
	context: Pick<CompilationContext, 'memoryDefaults' | 'pointerMetadata'>
): DataStructure {
	const memoryDefault = context.memoryDefaults[declaration.id];
	const pointerMetadata = getPointerMetadataWithDefinedFields(context.pointerMetadata[declaration.id]);

	return {
		...declaration,
		default: memoryDefault?.value ?? 0,
		...(memoryDefault ? { hasExplicitDefault: memoryDefault.hasExplicitDefault === true } : {}),
		isInherited: memoryDefault?.isInherited ?? false,
		...pointerMetadata,
	};
}

/** Returns a resolved memory item for the active module, or for a target module plan without semantic overlays. */
export function getMemoryItem(
	context: CompilationContext,
	memoryId: string,
	moduleId = context.namespace.moduleName
): DataStructure | undefined {
	const declaration = getPlannedMemoryDeclaration(context, memoryId, moduleId);
	if (!declaration) {
		return undefined;
	}

	if (!moduleId || moduleId === context.namespace.moduleName) {
		return createMemoryItem(declaration, context);
	}

	return createMemoryItem(declaration, { memoryDefaults: {}, pointerMetadata: {} });
}

/** Materializes a module's resolved memory map for compiler output and memory initialization. */
export function createMemoryMapFromPlan(
	module: PlannedMemoryModule | undefined,
	context: Pick<CompilationContext, 'memoryDefaults' | 'pointerMetadata'>
): MemoryMap {
	if (!module) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(module.memory).map(([id, declaration]) => [id, createMemoryItem(declaration, context)])
	) as MemoryMap;
}
