/**
 * Integration tests that verify all example projects compile without errors.
 */

import compile from '@8f4e/compiler';
import { parse8f4eToProject } from '@8f4e/editor-state';
import { pickProjectCompilerBlocks } from '@8f4e/tokenizer';
import { readdirSync, readFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function collectProjectPaths(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const entryPath = resolve(directory, entry.name);

		if (entry.isDirectory()) {
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
				const { entries, constantsBlocks, functionBlocks, prototypeBlocks } = pickProjectCompilerBlocks({
					codeBlocks: project.codeBlocks,
					groups: [],
					includedFunctionBlocks: project.includedFunctionBlocks,
				});
				const moduleCount = Object.values(entries).reduce((sum, group) => sum + group.length, 0);

				const result = compile(
					{
						entries,
						constants: constantsBlocks,
						functions: functionBlocks,
						prototypes: prototypeBlocks,
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
