import type { State } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { resolveWebUiOverlayConfig, webUiEditorConfigSchemaContribution } from './webUiConfig';

describe('web-ui editor config', () => {
	it('contributes overlay texture config schema paths', () => {
		expect(webUiEditorConfigSchemaContribution.root).toBe('webUI');
		expect(webUiEditorConfigSchemaContribution.schema).toMatchObject({
			type: 'object',
			properties: {
				overlay: {
					type: 'object',
					properties: {
						entry: { type: 'string' },
						target: { type: 'string' },
						width: { type: 'integer', minimum: 1 },
						height: { type: 'integer', minimum: 1 },
						size: {
							anyOf: [
								{ type: 'number', minimum: 1 },
								{ type: 'string', pattern: '^\\d+(?:\\.\\d+)?%$' },
							],
						},
						objectFit: { type: 'string', enum: ['fill', 'cover', 'contain', 'none'] },
					},
				},
			},
		});
	});

	it('resolves structured overlay texture config', () => {
		const state = {
			editorConfig: {
				webUI: {
					overlay: {
						entry: 'renderFrame',
						target: 'screen:rgba',
						width: 64,
						height: 32,
						size: '150%',
						filter: 'linear',
						objectFit: 'none',
					},
				},
			},
		} as State;

		expect(resolveWebUiOverlayConfig(state)).toEqual({
			entry: 'renderFrame',
			target: 'screen:rgba',
			width: 64,
			height: 32,
			size: '150%',
			filter: 'linear',
			objectFit: 'none',
		});
	});

	it('ignores incomplete overlay texture config', () => {
		const state = {
			editorConfig: {
				webUI: {
					overlay: {
						entry: 'renderFrame',
						target: 'screen',
						width: 64,
						height: 32,
					},
				},
			},
		} as State;

		expect(resolveWebUiOverlayConfig(state)).toBeUndefined();
	});
});
