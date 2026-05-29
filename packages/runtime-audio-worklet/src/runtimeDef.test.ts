import { describe, expect, it } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import { createAudioWorkletRuntimeDef, getAudioInputBuffers, getAudioOutputBuffers } from './runtimeDef';
import { storeAudioWorkletRuntimeValues } from './runtimeValues';

import type { State } from '@8f4e/editor';

describe('storeAudioWorkletRuntimeValues', () => {
	it('merges AudioWorklet runtime values into editor state', () => {
		const state = {
			runtime: {
				values: {},
			},
		} as State;
		const store = createStateManager(state);

		storeAudioWorkletRuntimeValues(store, state, { audioBufferSize: 128 });
		storeAudioWorkletRuntimeValues(store, state, { sampleRate: 48000 });

		expect(state.runtime.values.AudioWorkletRuntime).toEqual({
			audioBufferSize: 128,
			sampleRate: 48000,
		});
	});
});

describe('AudioWorklet runtime config', () => {
	function createState(): State {
		return {
			editorConfig: {
				audioRuntime: {
					audioOutBufferLAddress: 'audiooutL:buffer',
					audioOutBufferRAddress: 'audiooutR:buffer',
					audioInBufferLAddress: '16',
				},
			},
			compiler: {
				compiledModules: {
					audiooutL: {
						memoryMap: {
							buffer: { wordAlignedAddress: 8 },
						},
					},
					audiooutR: {
						memoryMap: {
							buffer: { wordAlignedAddress: 24 },
						},
					},
				},
			},
		} as State;
	}

	it('contributes audio buffer address config fields', () => {
		const runtimeDef = createAudioWorkletRuntimeDef(
			() => new Uint8Array(),
			() => null,
			'worklet.js'
		);

		expect(runtimeDef.editorConfigSchema?.schema.properties).toMatchObject({
			audioOutBufferLAddress: {
				format: 'memory-address',
				anyOf: [
					{ type: 'integer', minimum: 0 },
					{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
				],
			},
			audioOutBufferRAddress: {
				format: 'memory-address',
				anyOf: [
					{ type: 'integer', minimum: 0 },
					{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
				],
			},
			audioInBufferLAddress: {
				format: 'memory-address',
				anyOf: [
					{ type: 'integer', minimum: 0 },
					{ type: 'string', pattern: '^[^:\\s]+:[^:\\s]+$' },
				],
			},
		});
	});

	it('builds stereo output and mono input routes from audio runtime config', () => {
		const state = createState();

		expect(getAudioOutputBuffers(state)).toEqual([
			{ audioBufferWordAddress: 8, output: 0, channel: 0 },
			{ audioBufferWordAddress: 24, output: 0, channel: 1 },
		]);
		expect(getAudioInputBuffers(state)).toEqual([{ audioBufferWordAddress: 16, input: 0, channel: 0 }]);
	});
});
