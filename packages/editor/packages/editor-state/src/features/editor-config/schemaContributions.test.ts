import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { describe, expect, it } from 'vitest';
import { createEditorConfigSchemaContributionsValidator } from './schemaContributions';
import { resolveSchemaConfigRoot } from './schemaValidator';

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
								format: 'memory-address',
								anyOf: [
									{ type: 'integer', minimum: 0 },
									{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
								],
							},
						},
					},
				},
			},
			editorConfig: {
				audioRuntime: {
					sampleRate: 48000,
					audioOutBufferLAddress: 'audioout:buffer',
				},
			},
			compiler: {
				compiledModules: {
					audioout: {
						memoryMap: {
							buffer: { wordAlignedAddress: 32 },
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

	it('resolves memory-address formatted config values against compiled memory maps', () => {
		const state = store.getState();
		const config = resolveSchemaConfigRoot(state.editorConfigSchemaContributions.audio!, state.editorConfig, state);

		expect(config).toMatchObject({
			sampleRate: 48000,
			audioOutBufferLAddress: 32,
		});
	});

	it('validates dynamic object properties from additionalProperties schemas', () => {
		const dynamicStore = {
			getState: () =>
				({
					editorConfigSchemaContributions: {
						midi: {
							root: 'midi',
							schema: {
								type: 'object',
								properties: {
									inputs: {
										type: 'object',
										additionalProperties: {
											type: 'object',
											properties: {
												port: { type: 'integer', minimum: 0 },
												callback: { type: 'string', pattern: '^[A-Za-z_][A-Za-z0-9_]*$' },
											},
											additionalProperties: false,
										},
									},
								},
								additionalProperties: false,
							},
						},
					},
				}) as State,
		} as StateManager<State>;
		const validator = createEditorConfigSchemaContributionsValidator(dynamicStore);

		expect(validator.knownPaths).toEqual(['midi.inputs.*.port', 'midi.inputs.*.callback']);
		expect(
			validator.validate({
				path: 'midi.inputs.0.port',
				value: '0',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBeUndefined();
		expect(
			validator.validate({
				path: 'midi.inputs.0.callback',
				value: 'onMidiIn',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBeUndefined();
		expect(
			validator.validate({
				path: 'midi.inputs.0.callback',
				value: 'bad-name',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe("@config midi.inputs.0.callback: invalid string value 'bad-name'");
		expect(
			validator.validate({
				path: 'midi.inputs.0.unknown',
				value: '1',
				rawRow: 1,
				codeBlockId: 'config',
			})
		).toBe("@config: unknown config path 'midi.inputs.0.unknown'");
	});
});
