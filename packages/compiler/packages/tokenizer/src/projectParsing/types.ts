import type { CompilableBlockType, Module } from '@8f4e/compiler-spec';

export interface ProjectCodeBlock {
	id: number;
	code: string[];
	disabled?: boolean;
	entry?: string;
}

export interface ProjectCodeGroup {
	name: string;
	entry: string;
	codeBlocks: ProjectCodeBlock[];
	groups: ProjectCodeGroup[];
}

export interface ProjectInput {
	codeBlocks: ProjectCodeBlock[];
	groups: ProjectCodeGroup[];
	includedFunctionBlocks?: Module[];
	[key: string]: unknown;
}

export interface ProjectCompilerGroup {
	name: string;
	entry: string;
	modules: Module[];
	constantsBlocks: Module[];
	functionBlocks: Module[];
	prototypeBlocks: Module[];
	groups: ProjectCompilerGroup[];
}

export interface ProjectCompilerBlocks {
	entries: Record<string, Module[]>;
	constantsBlocks: Module[];
	functionBlocks: Module[];
	prototypeBlocks: Module[];
	groups: ProjectCompilerGroup[];
}

export type ProjectBlockType = CompilableBlockType | 'unknown';
