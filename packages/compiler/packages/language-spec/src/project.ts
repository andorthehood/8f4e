import type { MemoryDeclarationInstruction, PlannedMemoryDeclaration } from './memory';

/** Project-level source instructions consumed before individual code blocks are tokenized. */
export const projectInstructions = {
	entry: { opener: 'entry', closer: 'entryEnd' },
	group: { opener: 'group', closer: 'groupEnd' },
	expose: 'expose',
} as const;

export const projectInstructionNames = [
	projectInstructions.entry.opener,
	projectInstructions.entry.closer,
	projectInstructions.group.opener,
	projectInstructions.group.closer,
	projectInstructions.expose,
] as const;

export type ProjectInstructionName = (typeof projectInstructionNames)[number];

/** Stable identity shared by project actors and compiler diagnostics. */
export type ProjectBlockId = number;

/** Host-callable entry that owns an ordered module block. */
export type ProjectEntryName = string;

/** Human-readable name of one project group within its parent project. */
export type ProjectGroupName = string;

/** Canonical encoded path of a project group. The root project uses the empty path. */
export type ProjectGroupPath = string;

/** Canonical module identity shared by compiler results and project actors. */
export type ProjectModuleId = string;

/** Canonical path of the root project. */
export const ROOT_PROJECT_GROUP_PATH: ProjectGroupPath = '';

function encodeProjectPathSegment(segment: string): string {
	return encodeURIComponent(segment);
}

/** Returns the canonical path of a named child group. */
export function createChildProjectGroupPath(
	parentPath: ProjectGroupPath,
	groupName: ProjectGroupName
): ProjectGroupPath {
	const segment = encodeProjectPathSegment(groupName);
	return parentPath ? `${parentPath}/${segment}` : segment;
}

/** Returns the canonical identity of a module owned by the given group path. */
export function createProjectModuleId(groupPath: ProjectGroupPath, moduleName: string): ProjectModuleId {
	return groupPath ? `${groupPath}/${moduleName}` : moduleName;
}

/** Returns the canonical owning group path encoded in a module id. */
export function getProjectGroupPathFromModuleId(moduleId: ProjectModuleId): ProjectGroupPath {
	const separatorIndex = moduleId.lastIndexOf('/');
	return separatorIndex === -1 ? ROOT_PROJECT_GROUP_PATH : moduleId.slice(0, separatorIndex);
}

/** Source block fields shared by the canonical project collections. */
export interface ProjectBlock {
	id: ProjectBlockId;
	code: string[];
	disabled?: boolean;
}

/** Ordered executable block with required entry membership. */
export interface ProjectModuleBlock extends ProjectBlock {
	entry: ProjectEntryName;
}

/** Canonical in-memory representation shared by all 8f4e project actors. */
export interface ProjectObjectModel {
	/** Ordered executable modules; filtering by entry preserves execution order within that entry. */
	modules: ProjectModuleBlock[];
	/** Hoisted function blocks. */
	functions: ProjectBlock[];
	/** Hoisted constants blocks. */
	constants: ProjectBlock[];
	/** Hoisted prototype blocks. */
	prototypes: ProjectBlock[];
	/** Ordered include declarations expanded privately by the compiler. */
	includes: ProjectBlock[];
	/** Non-compiling project note blocks. */
	notes: ProjectBlock[];
	/** Incomplete or unclassified blocks retained by live editors. */
	unknown: ProjectBlock[];
	/** Recursively owned named project groups. */
	groups: ProjectGroupObjectModel[];
}

/** A group-owned public memory name backed by a memory item in one of the group's direct modules. */
export interface ProjectMemoryExposure {
	/** Public memory declaration type. It is intentionally not checked against the target's declaration type. */
	type: MemoryDeclarationInstruction;
	/** Public name used by the enclosing project. */
	name: string;
	/** Source-level name of the direct child module that owns the target memory item. */
	targetModuleName: string;
	/** Source-level memory item name in the target module. */
	targetMemoryName: string;
}

/** Canonical direct-module target of one public group memory alias. */
export interface ProjectMemoryAliasTarget {
	targetModuleId: ProjectModuleId;
	targetMemoryId: string;
}

/**
 * Compiler-internal lookup of public group memory names to canonical direct-module targets.
 * The outer key is the public group path used as an intermodule id; the inner key is the exposed memory name.
 */
export type ProjectMemoryAliasLookup = ReadonlyMap<ProjectGroupPath, ReadonlyMap<string, ProjectMemoryAliasTarget>>;

/** Resolves a structured intermodule reference through the group alias lookup when one exists. */
export function resolveProjectMemoryAlias(
	aliases: ProjectMemoryAliasLookup,
	targetModuleId: ProjectModuleId,
	targetMemoryId: string
): ProjectMemoryAliasTarget {
	return aliases.get(targetModuleId)?.get(targetMemoryId) ?? { targetModuleId, targetMemoryId };
}

/** Named child project owned by another project object model. */
export interface ProjectGroupObjectModel extends ProjectObjectModel {
	name: ProjectGroupName;
	entry: ProjectEntryName;
	/** Source lines owned by the group wrapper, excluding recursively owned child blocks. */
	code: string[];
	/** Ordered public memory aliases exposed to the enclosing project. */
	exposures: ProjectMemoryExposure[];
}

/** Compiler-resolved group exposure backed directly by the target's planned memory declaration. */
export interface ResolvedProjectMemoryExposure extends ProjectMemoryExposure {
	groupPath: ProjectGroupPath;
	targetModuleId: ProjectModuleId;
	targetMemory: PlannedMemoryDeclaration;
}

/** Resolved exposures indexed by the canonical path of the group that owns them. */
export type ProjectMemoryExposuresByGroupPath = Record<ProjectGroupPath, ResolvedProjectMemoryExposure[]>;

/** Host callback used to load a function include referenced by a project. */
export type ProjectIncludeResolver = (includeId: string) => string | Promise<string | undefined> | undefined;
