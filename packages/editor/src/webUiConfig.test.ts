import type { State } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { resolveWebUiBackgroundConfig, webUiEditorConfigSchemaContribution } from './webUiConfig';

describe('web-ui editor config', () => {
	it('contributes frame texture config schema paths', () => {
		expect(webUiEditorConfigSchemaContribution.root).toBe('webUI');
		expect(webUiEditorConfigSchemaContribution.schema).toMatchObject({
			type: 'object',
			properties: {
				background: {
					type: 'object',
					properties: {
						entry: { type: 'string' },
						target: { type: 'string' },
						textureWidth: { type: 'integer', minimum: 1 },
						textureHeight: { type: 'integer', minimum: 1 },
						objectFit: { type: 'string', enum: ['fill', 'cover', 'contain'] },
					},
				},
			},
		});
	});

	it('resolves structured frame texture config', () => {
		const state = {
			editorConfig: {
				webUI: {
					background: {
						entry: 'renderFrame',
						target: 'screen:rgba',
						textureWidth: 64,
						textureHeight: 32,
						filter: 'linear',
						objectFit: 'cover',
					},
				},
			},
		} as State;

		expect(resolveWebUiBackgroundConfig(state)).toEqual({
			entry: 'renderFrame',
			target: 'screen:rgba',
			textureWidth: 64,
			textureHeight: 32,
			filter: 'linear',
			objectFit: 'cover',
		});
	});

	it('ignores incomplete frame texture config', () => {
		const state = {
			editorConfig: {
				webUI: {
					background: {
						entry: 'renderFrame',
						target: 'screen',
						textureWidth: 64,
						textureHeight: 32,
					},
				},
			},
		} as State;

		expect(resolveWebUiBackgroundConfig(state)).toBeUndefined();
	});
});
