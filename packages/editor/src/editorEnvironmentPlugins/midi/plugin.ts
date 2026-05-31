import type { EditorEnvironmentPluginContext } from '../types';
import createMidiDeviceManager from './devices';
import createMidiIn from './midiIn';

export default function midiPlugin({
	store,
	navigator,
	setErrors,
	services,
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
		getWasmExports: services.getWasmExports,
	});

	syncMidiIn = midiIn.sync;

	return () => {
		midiIn.dispose();
		devices.dispose();
		setErrors([]);
	};
}
