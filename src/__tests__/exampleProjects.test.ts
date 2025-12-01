/**
 * Integration tests that verify all example projects under src/examples/projects/*
 * compile without errors - both module code and config blocks.
 *
 * This test suite ensures that:
 * 1. All example projects can be discovered programmatically
 * 2. All module code blocks compile without errors
 * 3. All config blocks compile without errors
 */
import * as path from 'path';
import * as fs from 'fs';

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
	environmentExtensions: {
		constants: {
			SAMPLE_RATE: { value: 44100, isInteger: true },
			AUDIO_BUFFER_SIZE: { value: 128, isInteger: true },
			LEFT_CHANNEL: { value: 0, isInteger: true },
			RIGHT_CHANNEL: { value: 1, isInteger: true },
		},
		ignoredKeywords: ['debug', 'button', 'switch', 'offset', 'plot', 'piano'],
	},
};

/**
 * Determines the type of a code block based on its first non-empty line.
 * Returns 'module', 'config', or 'unknown'.
 */
function getBlockType(code: string[]): 'module' | 'config' | 'unknown' {
	for (const line of code) {
		const trimmed = line.trim();
		if (trimmed === '') continue;
		if (trimmed === 'config') return 'config';
		if (trimmed.startsWith('module ')) return 'module';
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
	// Use file:// URL for ESM compatibility
	const fileUrl = `file://${filePath}`;
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
		expect(projectSlugs).toContain('crtEffect');
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
					.filter(block => getBlockType(block.code) === 'module')
					.map(block => ({ code: block.code }));

				// Compile all modules together and verify success
				const result = compile(moduleBlocks, COMPILER_OPTIONS);

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

			it(`should compile config blocks in project: ${slug}`, async () => {
				const { project } = await loadProject(filePath);

				// Extract config blocks
				const configBlocks = project.codeBlocks.filter(block => getBlockType(block.code) === 'config');

				if (configBlocks.length === 0) {
					// Some projects may not have config blocks - that's fine
					return;
				}

				configBlocks.forEach((block, index) => {
					// Extract the config program source (lines between 'config' and 'configEnd')
					const code = block.code;
					const configStartIndex = code.findIndex(line => line.trim() === 'config');
					const configEndIndex = code.findIndex(line => line.trim() === 'configEnd');

					if (configStartIndex === -1 || configEndIndex === -1) {
						throw new Error(`Config block ${index} in project ${slug} is missing 'config' or 'configEnd' marker`);
					}

					// Get the config body (excluding the markers)
					const configBody = code.slice(configStartIndex + 1, configEndIndex);
					const source = configBody.join('\n');

					// Compile the config
					const result = compileConfig(source);

					// Assert no errors
					expect(result.errors, `Config block ${index} in project ${slug} had compilation errors`).toEqual([]);
					expect(result.config, `Config block ${index} in project ${slug} produced null config`).not.toBeNull();
				});
			});
		});
	});
});
