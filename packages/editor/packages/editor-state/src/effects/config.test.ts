import { describe, it, expect } from 'vitest';

import { extractConfigBody, collectConfigBlocks, deepMergeConfig, applyConfigToState } from './config';

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

	describe('collectConfigBlocks', () => {
		it('should collect config blocks with their sources', () => {
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

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(2);
			expect(result[0].source).toBe('push 1');
			expect(result[0].block).toBe(block1);
			expect(result[1].source).toBe('push 2');
			expect(result[1].block).toBe(block2);
		});

		it('should sort config blocks by creationIndex', () => {
			const block1 = createMockCodeBlock({
				id: 'first',
				code: ['config', 'push first', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const block2 = createMockCodeBlock({
				id: 'second',
				code: ['config', 'push second', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const codeBlocks = new Set([block1, block2]);

			const result = collectConfigBlocks(codeBlocks);
			expect(result[0].block.id).toBe('second');
			expect(result[1].block.id).toBe('first');
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

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(1);
			expect(result[0].source).toBe('push 1');
		});

		it('should return empty array if no config blocks', () => {
			const moduleBlock = createMockCodeBlock({
				code: ['module test', 'moduleEnd'],
				blockType: 'module',
				creationIndex: 0,
			});
			const codeBlocks = new Set([moduleBlock]);

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(0);
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

			const result = collectConfigBlocks(codeBlocks);
			expect(result).toHaveLength(1);
			expect(result[0].source).toBe('push 1');
		});
	});

	describe('deepMergeConfig', () => {
		it('should merge flat objects', () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3, c: 4 };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ a: 1, b: 3, c: 4 });
		});

		it('should deep merge nested objects', () => {
			const target = { nested: { a: 1, b: 2 } };
			const source = { nested: { b: 3, c: 4 } };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ nested: { a: 1, b: 3, c: 4 } });
		});

		it('should replace arrays entirely', () => {
			const target = { items: [1, 2, 3] };
			const source = { items: [4, 5] };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({ items: [4, 5] });
		});

		it('should not mutate the original objects', () => {
			const target = { a: 1 };
			const source = { b: 2 };
			const result = deepMergeConfig(target, source);
			expect(target).toEqual({ a: 1 });
			expect(source).toEqual({ b: 2 });
			expect(result).toEqual({ a: 1, b: 2 });
		});

		it('should handle projectInfo-like structure', () => {
			const target = { projectInfo: { title: 'Title', author: 'Author' } };
			const source = { projectInfo: { description: 'Description' } };
			const result = deepMergeConfig(target, source);
			expect(result).toEqual({
				projectInfo: { title: 'Title', author: 'Author', description: 'Description' },
			});
		});
	});

	describe('applyConfigToState', () => {
		it('should apply title', () => {
			const state = createMockState();
			applyConfigToState(state, { title: 'Test Title' });
			expect(state.projectInfo.title).toBe('Test Title');
		});

		it('should apply author', () => {
			const state = createMockState();
			applyConfigToState(state, { author: 'Test Author' });
			expect(state.projectInfo.author).toBe('Test Author');
		});

		it('should apply description', () => {
			const state = createMockState();
			applyConfigToState(state, { description: 'Test Description' });
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

		it('should not apply runtimeSettings with invalid runtime type', () => {
			const state = createMockState();
			const originalSettings = [...state.compiler.runtimeSettings];
			// Invalid: runtime is not a valid enum value
			applyConfigToState(state, { runtimeSettings: [{ runtime: 'InvalidRuntime', sampleRate: 44100 }] });
			expect(state.compiler.runtimeSettings).toEqual(originalSettings);
		});

		it('should not throw for non-object config', () => {
			const state = createMockState();
			expect(() => applyConfigToState(state, null)).not.toThrow();
			expect(() => applyConfigToState(state, 'string')).not.toThrow();
			expect(() => applyConfigToState(state, 42)).not.toThrow();
		});

		it('should handle partial config', () => {
			const state = createMockState();
			state.projectInfo.title = 'Original';
			state.projectInfo.author = 'Original Author';
			applyConfigToState(state, { title: 'New Title' });
			expect(state.projectInfo.title).toBe('New Title');
			expect(state.projectInfo.author).toBe('Original Author');
		});
	});
});
