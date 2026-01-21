/**
 * Integration tests that verify all example projects under src/examples/projects/*
 * compile without errors - both module code and projectConfig blocks.
 *
 * This test suite ensures that:
 * 1. All example projects can be discovered programmatically
 * 2. All module code blocks compile without errors
 * 3. All projectConfig blocks compile without errors
 */
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

import { describe, it, expect } from 'vitest';
import compile from '@8f4e/compiler';
import { compileConfig } from '@8f4e/stack-config-compiler';

// Path to the examples/projects directory relative to project root
const projectsDir = path.resolve(__dirname, '../examples/projects');

/**
 * Shared compiler options that mirror what the app shell provides.
 * Includes runtime constants like SAMPLE_RATE that modules may reference.
 */
const COMPILER_OPTIONS = {
	memorySizeBytes: 65536,
	startingMemoryWordAddress: 0,
};

/**
 * Determines the type of a code block based on its first non-empty line.
 * Returns 'module', 'projectConfig', 'function', or 'unknown'.
 */
function getBlockType(code: string[]): 'module' | 'projectConfig' | 'function' | 'constants' | 'unknown' {
	for (const line of code) {
		const trimmed = line.trim();
		if (trimmed === '') continue;
		if (trimmed === 'projectConfig') return 'projectConfig';
		if (trimmed.startsWith('module ')) return 'module';
		if (trimmed.startsWith('function ')) return 'function';
		if (trimmed.startsWith('constants ')) return 'constants';
		break;
	}
	return 'unknown';
}

/**
 * Discovers all TypeScript project files under src/examples/projects/
 * Excludes index.ts which is the registry file.
 */
function discoverProjectFiles(): string[] {
	const files = fs.readdirSync(projectsDir);
	return files.filter(file => file.endsWith('.ts') && file !== 'index.ts').map(file => path.join(projectsDir, file));
}

/**
 * Loads a project from a TypeScript file.
 * Uses dynamic import to load the default export.
 */
async function loadProject(filePath: string): Promise<{ slug: string; project: { codeBlocks: { code: string[] }[] } }> {
	const slug = path.basename(filePath, '.ts');
	// Use pathToFileURL for cross-platform compatibility (handles Windows paths correctly)
	const fileUrl = pathToFileURL(filePath).href;
	const module = await import(fileUrl);
	return { slug, project: module.default };
}

describe('Example Projects Compilation', () => {
	it('should discover all example projects programmatically', () => {
		const projectFiles = discoverProjectFiles();
		expect(projectFiles.length).toBeGreaterThan(0);

		// Verify we found the expected project files
		const projectSlugs = projectFiles.map(f => path.basename(f, '.ts'));
		expect(projectSlugs).toContain('audioBuffer');
		expect(projectSlugs).toContain('rippleEffect');
		expect(projectSlugs).toContain('simpleCounterMainThread');
	});

	describe('Module Compilation', () => {
		const projectFiles = discoverProjectFiles();

		projectFiles.forEach(filePath => {
			const slug = path.basename(filePath, '.ts');

			it(`should compile module blocks in project: ${slug}`, async () => {
				const { project } = await loadProject(filePath);

				// Extract module blocks
				const moduleBlocks = project.codeBlocks
					.filter(block => getBlockType(block.code) === 'module' || getBlockType(block.code) === 'constants')
					.map(block => ({ code: block.code }));

				// Extract function blocks
				const functionBlocks = project.codeBlocks
					.filter(block => getBlockType(block.code) === 'function')
					.map(block => ({ code: block.code }));

				// Compile all modules together (with functions if present) and verify success
				const result = compile(moduleBlocks, COMPILER_OPTIONS, functionBlocks.length > 0 ? functionBlocks : undefined);

				expect(result.codeBuffer).toBeInstanceOf(Uint8Array);
				expect(result.codeBuffer.length).toBeGreaterThan(0);
				expect(Object.keys(result.compiledModules).length).toBe(moduleBlocks.length);
			});
		});
	});

	describe('Config Compilation', () => {
		const projectFiles = discoverProjectFiles();

		projectFiles.forEach(filePath => {
			const slug = path.basename(filePath, '.ts');

			it(`should compile projectConfig blocks in project: ${slug}`, async () => {
				const { project } = await loadProject(filePath);

				// Extract projectConfig blocks
				const configBlocks = project.codeBlocks.filter(block => getBlockType(block.code) === 'projectConfig');

				if (configBlocks.length === 0) {
					// Some projects may not have projectConfig blocks - that's fine
					return;
				}

				configBlocks.forEach((block, index) => {
					// Extract the config program source (lines between 'projectConfig' and 'projectConfigEnd')
					const code = block.code;
					const configStartIndex = code.findIndex(line => line.trim() === 'projectConfig');
					const configEndIndex = code.findIndex(line => line.trim() === 'projectConfigEnd');

					if (configStartIndex === -1 || configEndIndex === -1) {
						throw new Error(`Config block ${index} in project ${slug} is missing 'projectConfig' or 'projectConfigEnd' marker`);
					}

					// Get the config body (excluding the markers)
					const configBody = code.slice(configStartIndex + 1, configEndIndex);
					const source = configBody.join('\n');

					// Compile the config
					const result = compileConfig(source);

					// Assert no errors
					expect(
						result.errors,
						`Config block ${index} in project ${slug} had compilation errors: ${JSON.stringify(result.errors)}`
					).toEqual([]);
					expect(result.config, `Config block ${index} in project ${slug} produced null config`).not.toBeNull();
				});
			});
		});
	});
});
