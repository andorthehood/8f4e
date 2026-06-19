/**
 * Integration tests that verify all example projects compile without errors.
 */

import compile from '@8f4e/compiler';
import { resolveIncludeSourceTreeAsync } from '@8f4e/include-resolver';
import { prepareCompilerInputFromProjectSourceTreeAsync } from '@8f4e/project-preparser';
import { readdirSync, readFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { resolveStdlibInclude } from '../stdlib-resolver';

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

function loadProjectSource(name: string) {
	const projectPath = projectPaths.get(name);

	if (!projectPath) {
		throw new Error(`Project fixture not found: ${name}`);
	}

	return readFileSync(projectPath, 'utf-8');
}

const projectNames = Array.from(projectPaths.keys()).sort();

const COMPILER_OPTIONS = {
	startingMemoryWordAddress: 0,
};

describe('Example Projects Compilation', () => {
	describe('Module Compilation', () => {
		projectNames.forEach((projectName, index) => {
			it(`should compile module blocks in project ${index}`, async () => {
				const source = loadProjectSource(projectName);
				const sourceTree = await resolveIncludeSourceTreeAsync(source, resolveStdlibInclude);
				const compilerInput = await prepareCompilerInputFromProjectSourceTreeAsync(sourceTree);
				const moduleCount = Object.values(compilerInput.entries).reduce((sum, group) => sum + group.length, 0);

				const result = compile(compilerInput, COMPILER_OPTIONS);

				expect(result.codeBuffer).toBeInstanceOf(Uint8Array);
				expect(result.codeBuffer.length).toBeGreaterThan(0);
				expect(Object.keys(result.compiledModules).length).toBe(moduleCount);
			});
		});
	});
});
