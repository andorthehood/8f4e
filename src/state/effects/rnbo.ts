import RNBO from '@rnbo/js';

import { State } from '../types';
import { EventDispatcher } from '../../events';

export default function (state: State, events: EventDispatcher): void {
	let audioContext: AudioContext;
	const RNBODevices: Record<string, RNBO.Device> = {};
	const input = document.createElement('input');
	let outputNode: GainNode;
	input.type = 'file';

	async function removeRNBODevice(name: string) {
		if (RNBODevices[name]) {
			RNBODevices[name].node.disconnect(outputNode);
			delete RNBODevices[name];
			delete state.rnbo.patchers[name];
			events.dispatch('saveState');
		}
	}

	async function initRNBODevice(name: string) {
		if (!audioContext || !state.rnbo.patchers[name]) {
			return;
		}

		if (RNBODevices[name]) {
			RNBODevices[name].node.disconnect(outputNode);
		}

		const RNBODevice = await RNBO.createDevice({ context: audioContext, patcher: state.rnbo.patchers[name] });
		RNBODevice.node.connect(outputNode);
		RNBODevices[name] = RNBODevice;
	}

	async function initAudioContext() {
		if (audioContext) {
			return;
		}

		audioContext = new window.AudioContext();
		outputNode = audioContext.createGain();
		outputNode.connect(audioContext.destination);

		Object.keys(state.rnbo.patchers).forEach(name => {
			initRNBODevice(name);
		});
	}

	async function onRemoveRNBOPatches() {
		Object.keys(state.rnbo.patchers).forEach(name => {
			removeRNBODevice(name);
		});
	}

	async function onRNBOMessage(data) {
		if (!RNBODevices[data.patcherId]) {
			return;
		}

		for (let i = 0; i < data.params.length; i++) {
			if (RNBODevices[data.patcherId].parameters[i]) {
				RNBODevices[data.patcherId].parameters[i].value = data.params[i];
			}
		}
	}

	async function onImportRNBOPatch() {
		input.click();
	}

	input.addEventListener('change', event => {
		// @ts-ignore
		const file = event.target.files[0];

		// setting up the reader
		const reader = new FileReader();
		reader.readAsText(file, 'UTF-8');

		reader.addEventListener('load', readerEvent => {
			const content = readerEvent.target?.result?.toString();
			if (content) {
				state.rnbo.patchers[file.name] = JSON.parse(content);
				events.dispatch('saveState');
				initRNBODevice(file.name);
			}
		});
	});

	events.on('RNBOMessage', onRNBOMessage);
	events.on('importRNBOPatch', onImportRNBOPatch);
	events.on('mousedown', initAudioContext);
	events.on('removeRNBOPatches', onRemoveRNBOPatches);
}
