import { EventDispatcher } from '../types';

import type { State } from '../types';

export default async function sampleRate(state: State, events: EventDispatcher): Promise<void> {
	function onSetSampleRate({ sampleRate }: { sampleRate: number }) {
		state.compiler.runtimeSettings[state.compiler.selectedRuntime].sampleRate = sampleRate;
		events.dispatch('initRuntime');
		// Removed automatic save - user must manually save with Command+S
	}

	events.on('setSampleRate', onSetSampleRate);
}
