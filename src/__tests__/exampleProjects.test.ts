/**
 * Integration tests that verify all example projects compile without errors.
 */
import { readdirSync, readFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect } from 'vitest';
import compile from '@8f4e/compiler';
import { parse8f4eToProject } from '@8f4e/editor-state';
import { pickProjectCompilerBlocks } from '@8f4e/tokenizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function collectProjectPaths(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const entryPath = resolve(directory, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === 'archived') {
				return [];
			}

			return collectProjectPaths(entryPath);
		}

		return entry.name.endsWith('.8f4e') ? [entryPath] : [];
	});
}

const projectPaths = new Map(
	collectProjectPaths(resolve(__dirname, '../../packages/examples/src/projects')).map(
		path => [basename(path, '.8f4e'), path] as const
	)
);

function loadProject(name: string) {
	const projectPath = projectPaths.get(name);

	if (!projectPath) {
		throw new Error(`Project fixture not found: ${name}`);
	}

	return parse8f4eToProject(readFileSync(projectPath, 'utf-8'));
}

const projects = Array.from(projectPaths.keys()).sort().map(loadProject);

const COMPILER_OPTIONS = {
	startingMemoryWordAddress: 0,
};

describe('Example Projects Compilation', () => {
	describe('Module Compilation', () => {
		projects.forEach((project, index) => {
			it(`should compile module blocks in project ${index}`, () => {
				const { groups, constantsBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(project.codeBlocks);
				const moduleCount = Object.values(groups).reduce((sum, group) => sum + group.length, 0);

				const result = compile(
					{
						groups,
						constants: constantsBlocks,
						functions: functionBlocks.length > 0 ? functionBlocks : undefined,
						macros: macroBlocks.length > 0 ? macroBlocks : undefined,
					},
					COMPILER_OPTIONS
				);

				expect(result.codeBuffer).toBeInstanceOf(Uint8Array);
				expect(result.codeBuffer.length).toBeGreaterThan(0);
				expect(Object.keys(result.compiledModules).length).toBe(moduleCount);
			});
		});
	});
});
