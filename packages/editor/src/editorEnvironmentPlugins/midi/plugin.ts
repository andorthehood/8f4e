import createMidiDeviceManager from './devices';
import createMidiIn from './midiIn';

import type { EditorEnvironmentPluginContext } from '../types';

export default function midiPlugin({
	store,
	navigator,
	setErrors,
	wasmExports,
}: EditorEnvironmentPluginContext): () => void {
	let syncMidiIn = () => {};
	const devices = createMidiDeviceManager({
		store,
		navigator,
		onPortsChanged: () => syncMidiIn(),
	});
	const midiIn = createMidiIn({
		store,
		setErrors,
		getInputPort: devices.getInputPort,
		wasmExports,
	});

	syncMidiIn = midiIn.sync;

	return () => {
		midiIn.dispose();
		devices.dispose();
		setErrors([]);
	};
}
