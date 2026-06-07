import type { State } from '@8f4e/editor-state-types';
import { describe, expect, it, vi } from 'vitest';
import { binaryAssetsEditorConfigSchemaContribution, resolveBinaryAssetLoadRequests } from './config';

describe('binary asset editor config', () => {
	it('declares dynamic binary asset config entries', () => {
		expect(binaryAssetsEditorConfigSchemaContribution).toMatchObject({
			root: 'bin',
			schema: {
				type: 'object',
				additionalProperties: {
					type: 'object',
					properties: {
						url: { type: 'string' },
						memory: { type: 'string' },
						memories: { type: 'object' },
					},
				},
			},
		});
	});

	it('resolves single and named memory load targets', () => {
		const state = {
			editorConfig: {
				bin: {
					kick: {
						url: 'https://example.com/kick.pcm',
						memory: 'drums:kickBuffer',
						memories: {
							preview: 'preview:kickBuffer',
						},
					},
				},
			},
		} as unknown as State;

		expect(resolveBinaryAssetLoadRequests(state)).toEqual([
			{
				id: 'kick',
				url: 'https://example.com/kick.pcm',
				memoryId: 'drums:kickBuffer',
			},
			{
				id: 'kick',
				url: 'https://example.com/kick.pcm',
				memoryId: 'preview:kickBuffer',
			},
		]);
	});

	it('logs invalid direct state shapes and skips them', () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const state = {
			editorConfig: {
				bin: {
					kick: {
						memory: 'drums:kickBuffer',
					},
				},
			},
		} as unknown as State;

		expect(resolveBinaryAssetLoadRequests(state)).toEqual([]);
		expect(consoleError).toHaveBeenCalledWith('Binary asset config "kick" must define a url.');

		consoleError.mockRestore();
	});
});
