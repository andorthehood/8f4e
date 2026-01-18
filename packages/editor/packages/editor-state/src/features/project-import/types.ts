/**
 * Types for project import/export feature - project serialization and metadata.
 */

import type { CodeBlock } from '../code-blocks/types';
import type { ProjectViewport } from '../viewport/types';
import type { BinaryAsset } from '../binary-assets/types';
import type { ConfigObject } from '../config-compiler/types';
import type { CompiledModuleLookup } from '@8f4e/compiler';
import type { PostProcessEffect } from 'glugglug';

/**
 * Complete project structure for serialization and loading.
 */
export interface Project {
	codeBlocks: CodeBlock[];
	/** Viewport position using grid coordinates for persistent storage */
	viewport: ProjectViewport;
	binaryAssets?: BinaryAsset[];
	/** Compiled WebAssembly bytecode encoded as base64 string for runtime-only execution */
	compiledWasm?: string;
	compiledModules?: CompiledModuleLookup;
	memorySnapshot?: string;
	/** Compiled configuration from config blocks for runtime-only execution */
	compiledConfig?: ConfigObject;
	/** Post-process effects configuration for custom visual effects */
	postProcessEffects?: PostProcessEffect[];
}

/**
 * Default empty project structure used when no project is loaded from storage.
 */
export const EMPTY_DEFAULT_PROJECT: Project = {
	codeBlocks: [],
	compiledModules: {},
	viewport: {
		gridCoordinates: { x: 0, y: 0 },
	},
	binaryAssets: [],
};

/**
 * Example module metadata.
 */
export interface ExampleModule {
	title: string;
	description?: string;
	author: string;
	code: string;
	tests: unknown[];
	category: string;
	dependencies?: string[];
}

/**
 * Module metadata for listing.
 */
export interface ModuleMetadata {
	slug: string;
	title: string;
	description?: string;
	category: string;
}

/**
 * Project metadata for listing.
 */
export interface ProjectMetadata {
	slug: string;
	title: string;
	category: string;
}

/**
 * Callback for getting list of modules.
 */
export type GetListOfModulesCallback = () => Promise<ModuleMetadata[]>;

/**
 * Callback for getting a module by slug.
 */
export type GetModuleCallback = (slug: string) => Promise<ExampleModule>;

/**
 * Callback for getting list of projects.
 */
export type GetListOfProjectsCallback = () => Promise<ProjectMetadata[]>;

/**
 * Callback for getting a project by slug.
 */
export type GetProjectCallback = (slug: string) => Promise<Project>;

/**
 * Callback for loading session state.
 */
export type LoadSessionCallback = () => Promise<Project | null>;

/**
 * Callback for saving session state.
 */
export type SaveSessionCallback = (project: Project) => Promise<void>;

/**
 * Callback for importing a project.
 */
export type ImportProjectCallback = () => Promise<Project>;

/**
 * Callback for exporting a project.
 */
export type ExportProjectCallback = (data: string, fileName: string) => Promise<void>;

/**
 * Callback for exporting binary code.
 */
export type ExportBinaryCodeCallback = (fileName: string) => Promise<void>;
