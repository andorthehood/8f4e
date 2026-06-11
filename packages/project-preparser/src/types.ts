import type { CompilableBlockType } from '@8f4e/compiler-spec';

export interface ProjectBlock {
	id: number;
	code: string[];
	disabled?: boolean;
	entry?: string;
}

export interface ProjectGroup {
	name: string;
	entry: string;
	codeBlocks: ProjectBlock[];
	groups: ProjectGroup[];
}

export interface ProjectDocument {
	codeBlocks: ProjectBlock[];
	groups: ProjectGroup[];
	[key: string]: unknown;
}

export type ProjectBlockType = CompilableBlockType | 'unknown';
