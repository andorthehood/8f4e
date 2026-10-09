import type {
	CompilationContext,
	MemoryDefaultValue,
	MemoryPointerMetadata,
	MemoryPointerMetadataMap,
	PlannedMemoryDeclaration,
} from '@8f4e/language-spec';
import { BlockType, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/language-spec';
import { createCompilationContext } from '@8f4e/semantic-utils';
export type MemoryFixture = PlannedMemoryDeclaration &
	MemoryPointerMetadata & {
		default?: MemoryDefaultValue;
		hasExplicitDefault?: boolean;
		isInherited?: boolean;
	};

type MemoryFixtureMap = Record<string, MemoryFixture>;

function getWordAlignedByteLength(wordAlignedSize: number): number {
	return Math.max(0, wordAlignedSize) * GLOBAL_ALIGNMENT_BOUNDARY;
}

function getEndByteAddress(byteAddress: number, wordAlignedSize: number): number {
	return wordAlignedSize <= 0 ? byteAddress : byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY;
}

function getEndAddressSafeByteLength(wordAlignedSize: number): number {
	return wordAlignedSize > 0 ? GLOBAL_ALIGNMENT_BOUNDARY : 0;
}

export default function createStackAnalyzerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	return createCompilationContext({
		...overrides,
		namespace: { moduleName: 'test', ...overrides.namespace },
		blockStack: overrides.blockStack ?? [{ blockType: BlockType.MODULE, expectedResultTypes: [] }],
		codeBlockId: overrides.codeBlockId ?? 'test',
		codeBlockType: overrides.codeBlockType ?? 'module',
	});
}
/** Seeds compiler memory-plan context fields from planned memory declaration fixtures. */
export function seedTestMemoryDeclarations(
	context: CompilationContext,
	memoryDeclarations: MemoryFixtureMap
): CompilationContext {
	const memory = Object.fromEntries(
		Object.entries(memoryDeclarations).map(([id, memoryItem]) => {
			const {
				default: _default,
				hasExplicitDefault: _hasExplicitDefault,
				isInherited: _isInherited,
				pointeeMemoryIndex: _pointeeMemoryIndex,
				pointeeMemoryRegionName: _pointeeMemoryRegionName,
				pointeeElementCount: _pointeeElementCount,
				...declaration
			} = memoryItem;
			return [id, declaration as PlannedMemoryDeclaration];
		})
	);
	const pointerMetadata = Object.fromEntries(
		Object.entries(memoryDeclarations)
			.filter(([, memoryItem]) => memoryItem.pointeeBaseType)
			.map(([id, memoryItem]) => [
				id,
				{
					...(memoryItem.pointeeMemoryIndex !== undefined ? { pointeeMemoryIndex: memoryItem.pointeeMemoryIndex } : {}),
					...(memoryItem.pointeeMemoryRegionName
						? { pointeeMemoryRegionName: memoryItem.pointeeMemoryRegionName }
						: {}),
					...(memoryItem.pointeeElementCount !== undefined
						? { pointeeElementCount: memoryItem.pointeeElementCount }
						: {}),
				},
			])
	) as MemoryPointerMetadataMap;
	const declarations = Object.values(memory);
	const wordAlignedSize = declarations.reduce(
		(max, declaration) => Math.max(max, declaration.wordAlignedAddress + declaration.wordAlignedSize),
		0
	);
	const byteAddress = 0;
	const module = {
		id: context.namespace.moduleName ?? 'test',
		lineNumber: 0,
		byteAddress,
		wordAlignedSize,
		wordAlignedByteLength: getWordAlignedByteLength(wordAlignedSize),
		endByteAddress: getEndByteAddress(byteAddress, wordAlignedSize),
		endAddressSafeByteLength: getEndAddressSafeByteLength(wordAlignedSize),
		memory,
		declarations,
		declarationSources: [],
		memoryIndex: context.currentMemoryIndex,
		...(context.currentMemoryRegionName ? { memoryRegionName: context.currentMemoryRegionName } : {}),
	};

	context.memoryPlan = {
		modules: { [module.id]: module },
		moduleList: [module],
		nextByteAddressByMemoryIndex: {},
	};
	context.currentPlannedModule = module;
	context.memoryDefaults = Object.fromEntries(
		Object.entries(memoryDeclarations).map(([id, memoryItem]) => [
			id,
			{
				value: memoryItem.default ?? 0,
				hasExplicitDefault: memoryItem.hasExplicitDefault === true,
				isInherited: memoryItem.isInherited ?? false,
			},
		])
	);
	context.pointerMetadata = pointerMetadata;

	return context;
}
