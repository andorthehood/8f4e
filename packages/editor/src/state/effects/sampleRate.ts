import { EventDispatcher } from '../../events';
import { State } from '../types';

export default async function sampleRate(state: State, events: EventDispatcher): Promise<void> {
	function onSetSampleRate({ sampleRate }) {
		state.project.sampleRate = sampleRate;
		state.runtime.runner = sampleRate <= 1000 ? 'webWorker' : 'audioWorklet';
		events.dispatch('initRuntime');
		events.dispatch('saveState');
	}

	events.on('setSampleRate', onSetSampleRate);
}
