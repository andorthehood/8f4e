/** Stable identity shared by project actors and compiler diagnostics. */
export type ProjectBlockId = number;

/** Host-callable entry that owns an ordered module block. */
export type ProjectEntryName = string;

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

/** Recursive project organization metadata referencing canonically owned blocks. */
export interface ProjectGroup {
	name: string;
	entry: ProjectEntryName;
	blockIds: ProjectBlockId[];
	groups: ProjectGroup[];
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
	/** Project organization metadata; blocks remain owned by the collections above. */
	groups: ProjectGroup[];
}

/** Host callback used to load a function include referenced by a project. */
export type ProjectIncludeResolver = (includeId: string) => string | Promise<string | undefined> | undefined;
