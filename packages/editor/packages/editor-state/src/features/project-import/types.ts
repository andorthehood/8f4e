/**
 * Types for project import/export feature - project serialization and metadata.
 */

import type { CompiledModuleLookup } from '@8f4e/compiler';
import type { PostProcessEffect } from 'glugglug';
import type { CodeBlock } from '../code-blocks/types';
import type { ProjectConfig } from '../config-compiler/types';
import type { ProjectViewport } from '../viewport/types';

/**
 * Complete project structure for serialization and loading.
 */
export interface Project {
	codeBlocks: CodeBlock[];
	/** Viewport position using grid coordinates for persistent storage */
	viewport: ProjectViewport;
	/** Compiled WebAssembly bytecode encoded as base64 string for runtime-only execution */
	compiledWasm?: string;
	compiledModules?: CompiledModuleLookup;
	memorySnapshot?: string;
	/** Compiled configuration from config blocks for runtime-only execution */
	compiledProjectConfig?: ProjectConfig;
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
