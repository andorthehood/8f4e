import { StateManager } from '@8f4e/state-manager';

import type { State } from '@8f4e/editor';

export const AUDIO_WORKLET_RUNTIME_ID = 'AudioWorkletRuntime';

export function storeAudioWorkletRuntimeValues(
	store: StateManager<State>,
	state: State,
	values: Record<string, unknown>
) {
	store.set('runtime.values', {
		...state.runtime.values,
		[AUDIO_WORKLET_RUNTIME_ID]: {
			...(state.runtime.values[AUDIO_WORKLET_RUNTIME_ID] ?? {}),
			...values,
		},
	});
}
