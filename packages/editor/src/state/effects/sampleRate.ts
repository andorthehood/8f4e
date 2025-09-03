import { EventDispatcher } from '../../events';

import type { State } from '../types';

export default async function sampleRate(state: State, events: EventDispatcher): Promise<void> {
	function onSetSampleRate({ sampleRate }) {
		state.project.runtimeSettings[state.project.selectedRuntime].sampleRate = sampleRate;
		events.dispatch('initRuntime');
		events.dispatch('saveState');
	}

	events.on('setSampleRate', onSetSampleRate);
}
