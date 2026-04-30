/**
 * Types for project import/export feature - project serialization and metadata.
 */

import type { CompiledModuleLookup } from '@8f4e/compiler';
import type { PostProcessEffect } from 'glugglug';
import type { CodeBlock } from '../code-blocks/types';

/**
 * Complete project structure for serialization and loading.
 */
export interface Project {
	codeBlocks: CodeBlock[];
	/** Compiled WebAssembly bytecode encoded as base64 string for runtime-only execution */
	compiledWasm?: string;
	compiledModules?: CompiledModuleLookup;
	memorySnapshot?: string;
	/** Post-process effects configuration for custom visual effects */
	postProcessEffects?: PostProcessEffect[];
}

/**
 * Module metadata for listing.
 */
export interface ModuleMetadata {
	slug: string;
	title: string;
	description?: string;
	category: string;
	dependencies?: string[];
}

/**
 * Project metadata for listing.
 */
export interface ProjectMetadata {
	url: string;
	title: string;
	category: string;
}
