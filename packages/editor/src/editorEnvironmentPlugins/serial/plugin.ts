import createSerialDeviceManager from './devices';
import createSerialIn from './serialIn';

import type { EditorEnvironmentPluginContext } from '../types';

export default function serialPlugin({
	store,
	navigator,
	memoryViews,
	setErrors,
	services,
}: EditorEnvironmentPluginContext): () => void {
	let syncSerialIn = () => {};
	const devices = createSerialDeviceManager({
		store,
		navigator,
		onPortsChanged: () => syncSerialIn(),
	});
	const serialIn = createSerialIn({
		store,
		memoryViews,
		setErrors,
		getPort: devices.getPort,
		getWasmExports: services.getWasmExports,
	});

	syncSerialIn = serialIn.sync;

	return () => {
		serialIn.dispose();
		devices.dispose();
		setErrors([]);
	};
}
