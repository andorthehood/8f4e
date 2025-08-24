import audioWorkletRuntime from './runtimes/audioWorkletRuntime';
import webWorkerMIDIRuntime from './runtimes/webWorkerMIDIRuntime';
import webWorkerLogicRuntime from './runtimes/webWorkerLogicRuntime';

import { EventDispatcher } from '../../events';
import { State, WebWorkerLogicRuntime, AudioWorkletRuntime, WebWorkerMIDIRuntime } from '../types';

export default async function runtime(state: State, events: EventDispatcher) {
	let runtimeDestroyer: null | (() => void) = null;
	let onlineRuntime: null | string;

	function initRuntime() {
		const runtime = state.project.runtimeSettings[state.project.selectedRuntime];

		if (onlineRuntime === runtime.runtime) {
			events.dispatch('syncCodeAndSettingsWithRuntime');
			return;
		}

		switch (runtime.runtime) {
			case 'AudioWorkletRuntime':
				runtimeDestroyer = audioWorkletRuntime(state, events);
				onlineRuntime = 'AudioWorkletRuntime';
				break;
			case 'WebWorkerMIDIRuntime':
				runtimeDestroyer = webWorkerMIDIRuntime(state, events);
				onlineRuntime = 'WebWorkerMIDIRuntime';
				break;
			case 'WebWorkerLogicRuntime':
				runtimeDestroyer = webWorkerLogicRuntime(state, events);
				onlineRuntime = 'WebWorkerLogicRuntime';
		}
	}

	function changeRuntime({
		selectedRuntime,
	}: {
		selectedRuntime:
			| WebWorkerLogicRuntime['runtime']
			| AudioWorkletRuntime['runtime']
			| WebWorkerMIDIRuntime['runtime'];
	}) {
		if (onlineRuntime === selectedRuntime) {
			return;
		}

		if (runtimeDestroyer) {
			runtimeDestroyer();
			runtimeDestroyer = null;
		}

		const preSavedRuntime = state.project.runtimeSettings.findIndex(({ runtime }) => runtime === selectedRuntime);

		if (preSavedRuntime !== -1) {
			state.project.selectedRuntime = preSavedRuntime;
		} else {
			state.project.selectedRuntime =
				state.project.runtimeSettings.push({
					runtime: selectedRuntime,
					sampleRate: 50,
				}) - 1;
		}

		initRuntime();
	}

	events.on('buildFinished', initRuntime);
	events.on('changeRuntime', changeRuntime);
}
