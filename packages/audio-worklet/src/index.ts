import { Connection, Module, setUpConnections } from '@8f4e/compiler';

import createModule from './createModule';

class Main extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = event => {
			// Handling data from the node.
			console.log('event', event);
			createModule(event.data.memoryRef, event.data.modules);
		};
	}

	static get parameterDescriptors() {
		return [{ name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 }];
	}

	process(inputs, outputs, parameters) {
		const output = outputs[0];
		const amplitude = parameters.amplitude;
		const isAmplitudeConstant = amplitude.length === 1;

		for (let channel = 0; channel < output.length; ++channel) {
			const outputChannel = output[channel];
			for (let i = 0; i < outputChannel.length; ++i) {
				outputChannel[i] = 2 * (Math.random() - 0.5) * (isAmplitudeConstant ? amplitude[0] : amplitude[i]);
			}
		}

		return true;
	}
}

registerProcessor('worklet', Main);
