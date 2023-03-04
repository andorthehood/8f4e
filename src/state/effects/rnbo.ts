import RNBO from '@rnbo/js';

import { State } from '../types';
import { EventDispatcher } from '../../events';

export default function (state: State, events: EventDispatcher): void {
	let audioContext: AudioContext;
	let RNBODevice: RNBO.Device;
	const input = document.createElement('input');
	input.type = 'file';

	async function initRNBODevice() {
		if (!audioContext || !state.rnbo.patcher) {
			return;
		}

		const outputNode = audioContext.createGain();
		outputNode.connect(audioContext.destination);
		RNBODevice = await RNBO.createDevice({ context: audioContext, patcher: state.rnbo.patcher });
		RNBODevice.node.connect(outputNode);
	}

	async function initAudioContext() {
		if (audioContext) {
			return;
		}

		audioContext = new window.AudioContext();

		initRNBODevice();
	}

	async function onRNBOMessage(data) {
		if (!RNBODevice) {
			return;
		}

		for (let i = 0; i < data.params.length; i++) {
			if (RNBODevice.parameters[i]) {
				RNBODevice.parameters[i].value = data.params[i];
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
				state.rnbo.patcher = JSON.parse(content);
				events.dispatch('saveState');
				initRNBODevice();
			}
		});
	});

	events.on('RNBOMessage', onRNBOMessage);
	events.on('importRNBOPatch', onImportRNBOPatch);
	events.on('mousedown', initAudioContext);
}
