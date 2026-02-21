/**
 * Integration tests that verify all example projects compile without errors -
 * both module code and config blocks.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect } from 'vitest';
import compile from '@8f4e/compiler';
import { compileConfig } from '@8f4e/stack-config-compiler';
import { parse8f4eToProject } from '@8f4e/editor-state';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectsDir = resolve(__dirname, '../../packages/examples/src/projects');

function loadProject(name: string) {
	return parse8f4eToProject(readFileSync(resolve(projectsDir, `${name}.8f4e`), 'utf-8'));
}

const projects = [
	'audioBuffer',
	'audioLoopback',
	'bistableMultivibrators',
	'dancingWithTheSineLT',
	'xorProblem',
	'randomGenerators',
	'rippleEffect',
	'samplePlayer',
	'simpleCounterMainThread',
	'standaloneProject',
].map(loadProject);

const COMPILER_OPTIONS = {
	memorySizeBytes: 65536,
	startingMemoryWordAddress: 0,
};

function getBlockType(code: string[]): 'module' | 'config' | 'function' | 'constants' | 'unknown' {
	for (const line of code) {
		const trimmed = line.trim();
		if (trimmed === '') continue;
		if (trimmed === 'config') return 'config';
		if (trimmed.startsWith('module ')) return 'module';
		if (trimmed.startsWith('function ')) return 'function';
		if (trimmed.startsWith('constants ')) return 'constants';
		break;
	}
	return 'unknown';
}

describe('Example Projects Compilation', () => {
	describe('Module Compilation', () => {
		projects.forEach((project, index) => {
			it(`should compile module blocks in project ${index}`, () => {
				const moduleBlocks = project.codeBlocks
					.filter(block => getBlockType(block.code) === 'module' || getBlockType(block.code) === 'constants')
					.map(block => ({ code: block.code }));

				const functionBlocks = project.codeBlocks
					.filter(block => getBlockType(block.code) === 'function')
					.map(block => ({ code: block.code }));

				const result = compile(moduleBlocks, COMPILER_OPTIONS, functionBlocks.length > 0 ? functionBlocks : undefined);

				expect(result.codeBuffer).toBeInstanceOf(Uint8Array);
				expect(result.codeBuffer.length).toBeGreaterThan(0);
				expect(Object.keys(result.compiledModules).length).toBe(moduleBlocks.length);
			});
		});
	});

	describe('Config Compilation', () => {
		projects.forEach((project, projectIndex) => {
			it(`should compile config blocks in project ${projectIndex}`, () => {
				const configBlocks = project.codeBlocks.filter(block => getBlockType(block.code) === 'config');

				if (configBlocks.length === 0) {
					return;
				}

				configBlocks.forEach((block, index) => {
					const code = block.code;
					const configStartIndex = code.findIndex(line => line.trim() === 'config');
					const configEndIndex = code.findIndex(line => line.trim() === 'configEnd');

					if (configStartIndex === -1 || configEndIndex === -1) {
						throw new Error(
							`Config block ${index} in project ${projectIndex} is missing 'config' or 'configEnd' marker`
						);
					}

					const configBody = code.slice(configStartIndex + 1, configEndIndex);
					const source = configBody.join('\n');

					const result = compileConfig([source]);

					expect(
						result.errors,
						`Config block ${index} in project ${projectIndex} had compilation errors: ${JSON.stringify(result.errors)}`
					).toEqual([]);
					expect(result.config, `Config block ${index} in project ${projectIndex} produced null config`).not.toBeNull();
				});
			});
		});
	});
});
