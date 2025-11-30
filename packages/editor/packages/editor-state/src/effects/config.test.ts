import { describe, it, expect } from 'vitest';

import { extractConfigBody, collectConfigSource, applyConfigToState } from './config';

import { createMockCodeBlock, createMockState } from '../helpers/testUtils';

describe('config effect', () => {
	describe('extractConfigBody', () => {
		it('should extract the body between config and configEnd markers', () => {
			const code = ['config', 'push 42', 'set', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42', 'set']);
		});

		it('should handle empty body between markers', () => {
			const code = ['config', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should handle leading whitespace on markers', () => {
			const code = ['  config', 'push 42', '  configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual(['push 42']);
		});

		it('should return empty array if no config marker', () => {
			const code = ['push 42', 'configEnd'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if no configEnd marker', () => {
			const code = ['config', 'push 42'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array for empty code', () => {
			const code: string[] = [];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});

		it('should return empty array if config comes after configEnd', () => {
			const code = ['configEnd', 'push 42', 'config'];
			const body = extractConfigBody(code);
			expect(body).toEqual([]);
		});
	});

	describe('collectConfigSource', () => {
		it('should collect and concatenate config block sources', () => {
			const block1 = createMockCodeBlock({
				code: ['config', 'push 1', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const block2 = createMockCodeBlock({
				code: ['config', 'push 2', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const codeBlocks = new Set([block1, block2]);

			const source = collectConfigSource(codeBlocks);
			expect(source).toBe('push 1\npush 2');
		});

		it('should sort config blocks by creationIndex', () => {
			const block1 = createMockCodeBlock({
				code: ['config', 'push first', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const block2 = createMockCodeBlock({
				code: ['config', 'push second', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const codeBlocks = new Set([block1, block2]);

			const source = collectConfigSource(codeBlocks);
			expect(source).toBe('push second\npush first');
		});

		it('should skip non-config blocks', () => {
			const configBlock = createMockCodeBlock({
				code: ['config', 'push 1', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const moduleBlock = createMockCodeBlock({
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 1,
			});
			const codeBlocks = new Set([configBlock, moduleBlock]);

			const source = collectConfigSource(codeBlocks);
			expect(source).toBe('push 1');
		});

		it('should return empty string if no config blocks', () => {
			const moduleBlock = createMockCodeBlock({
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			});
			const codeBlocks = new Set([moduleBlock]);

			const source = collectConfigSource(codeBlocks);
			expect(source).toBe('');
		});

		it('should skip config blocks with empty bodies', () => {
			const emptyBlock = createMockCodeBlock({
				code: ['config', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const contentBlock = createMockCodeBlock({
				code: ['config', 'push 1', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const codeBlocks = new Set([emptyBlock, contentBlock]);

			const source = collectConfigSource(codeBlocks);
			expect(source).toBe('push 1');
		});
	});

	describe('applyConfigToState', () => {
		it('should apply projectInfo.title', () => {
			const state = createMockState();
			applyConfigToState(state, { projectInfo: { title: 'Test Title' } });
			expect(state.projectInfo.title).toBe('Test Title');
		});

		it('should apply projectInfo.author', () => {
			const state = createMockState();
			applyConfigToState(state, { projectInfo: { author: 'Test Author' } });
			expect(state.projectInfo.author).toBe('Test Author');
		});

		it('should apply projectInfo.description', () => {
			const state = createMockState();
			applyConfigToState(state, { projectInfo: { description: 'Test Description' } });
			expect(state.projectInfo.description).toBe('Test Description');
		});

		it('should apply memorySizeBytes', () => {
			const state = createMockState();
			applyConfigToState(state, { memorySizeBytes: 65536 });
			expect(state.compiler.compilerOptions.memorySizeBytes).toBe(65536);
		});

		it('should apply selectedRuntime', () => {
			const state = createMockState();
			applyConfigToState(state, { selectedRuntime: 1 });
			expect(state.compiler.selectedRuntime).toBe(1);
		});

		it('should apply runtimeSettings', () => {
			const state = createMockState();
			const runtimeSettings = [
				{ runtime: 'AudioWorkletRuntime' as const, sampleRate: 44100 },
				{ runtime: 'WebWorkerLogicRuntime' as const, sampleRate: 50 },
			];
			applyConfigToState(state, { runtimeSettings });
			expect(state.compiler.runtimeSettings).toEqual(runtimeSettings);
		});

		it('should not apply invalid runtimeSettings', () => {
			const state = createMockState();
			const originalSettings = [...state.compiler.runtimeSettings];
			// Invalid: missing runtime or sampleRate
			applyConfigToState(state, { runtimeSettings: [{ invalid: true }] });
			expect(state.compiler.runtimeSettings).toEqual(originalSettings);
		});

		it('should not throw for non-object config', () => {
			const state = createMockState();
			expect(() => applyConfigToState(state, null)).not.toThrow();
			expect(() => applyConfigToState(state, 'string')).not.toThrow();
			expect(() => applyConfigToState(state, 42)).not.toThrow();
		});

		it('should handle partial projectInfo', () => {
			const state = createMockState();
			state.projectInfo.title = 'Original';
			state.projectInfo.author = 'Original Author';
			applyConfigToState(state, { projectInfo: { title: 'New Title' } });
			expect(state.projectInfo.title).toBe('New Title');
			expect(state.projectInfo.author).toBe('Original Author');
		});
	});
});
