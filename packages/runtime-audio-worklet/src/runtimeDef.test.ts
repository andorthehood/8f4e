import { describe, expect, it } from 'vitest';
import createStateManager from '@8f4e/state-manager';

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
