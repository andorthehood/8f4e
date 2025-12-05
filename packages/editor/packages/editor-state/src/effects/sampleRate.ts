import { EventDispatcher } from '../types';

import type { State } from '../types';

export default async function sampleRate(state: State, events: EventDispatcher): Promise<void> {
	function onSetSampleRate({ sampleRate }: { sampleRate: number }) {
		state.runtime.runtimeSettings[state.runtime.selectedRuntime].sampleRate = sampleRate;
		events.dispatch('initRuntime');
	}

	events.on('setSampleRate', onSetSampleRate);
}
