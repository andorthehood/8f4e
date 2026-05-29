import { describe, expect, it } from 'vitest';

import { createEditorConfigSchemaContributionsValidator } from './schemaContributions';

import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

const store = {
	getState: () =>
		({
			editorConfigSchemaContributions: {
				audio: {
					root: 'audioRuntime',
					defaults: { sampleRate: 44100 },
					schema: {
						type: 'object',
						properties: {
							sampleRate: { type: 'number', minimum: 1 },
							audioOutBufferLAddress: {
								anyOf: [
									{ type: 'integer', minimum: 0 },
									{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
								],
							},
						},
					},
				},
			},
		}) as State,
} as StateManager<State>;

describe('editor config schema contributions', () => {
	it('validates and parses values against contributed schemas', () => {
		const validator = createEditorConfigSchemaContributionsValidator(store);

		expect(
			validator.validate({
				path: 'audioRuntime.sampleRate',
				value: '48000',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBeUndefined();

		expect(
			validator.parse?.({ path: 'audioRuntime.sampleRate', value: '48000', rawRow: 1, codeBlockId: 'config' })
		).toBe(48000);
		expect(
			validator.parse?.({
				path: 'audioRuntime.audioOutBufferLAddress',
				value: '24',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe(24);
		expect(
			validator.parse?.({
				path: 'audioRuntime.audioOutBufferLAddress',
				value: 'audioout:buffer',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe('audioout:buffer');
		expect(
			validator.validate({
				path: 'audioRuntime.audioOutBufferLAddress',
				value: 'audioout',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe("@config audioRuntime.audioOutBufferLAddress: invalid value 'audioout'");

		expect(
			validator.validate({
				path: 'audioRuntime.sampleRate',
				value: '0',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe('@config audioRuntime.sampleRate: value 0 must be at least 1');

		expect(
			validator.validate({
				path: 'audioRuntime.unknown',
				value: '1',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe("@config: unknown config path 'audioRuntime.unknown'");
	});
});
