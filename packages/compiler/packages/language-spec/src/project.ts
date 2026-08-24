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
	const segment = encodeProjectPathSegment(moduleName);
	return groupPath ? `${groupPath}/${segment}` : segment;
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

/** Named child project owned by another project object model. */
export interface ProjectGroupObjectModel extends ProjectObjectModel {
	name: ProjectGroupName;
	entry: ProjectEntryName;
}

/** Host callback used to load a function include referenced by a project. */
export type ProjectIncludeResolver = (includeId: string) => string | Promise<string | undefined> | undefined;
