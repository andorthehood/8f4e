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

/** Canonical in-memory representation shared by all 8f4e project actors. */
export interface ProjectObjectModel {
	/** Stable identity used to distinguish this project from sibling sub-programs. */
	id?: string;
	/** Human-readable project or group name. */
	name?: string;
	/** Entry containing this nested project when it originated from textual project syntax. */
	entry?: ProjectEntryName;
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
	/** Recursively owned sub-programs. */
	groups: ProjectObjectModel[];
}

/** Host callback used to load a function include referenced by a project. */
export type ProjectIncludeResolver = (includeId: string) => string | Promise<string | undefined> | undefined;
