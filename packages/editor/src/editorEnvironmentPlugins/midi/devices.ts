import type { StateManager } from '@8f4e/state-manager';
import type { InfoRecord, State } from '@8f4e/editor-state-types';

interface MidiDevicesOptions {
	store: StateManager<State>;
	navigator: Navigator;
	onPortsChanged?: () => void;
}

interface ConnectedMidiDevices {
	inputsByPort: Map<string, MIDIInput>;
}

export interface MidiDeviceManager {
	getInputPort: (port: string) => MIDIInput | undefined;
	dispose: () => void;
}

function formatPortName(port: MIDIPort, fallback: string): string {
	const name = port.name?.trim();

	return name || fallback;
}

function isConnectedPort(port: MIDIPort): boolean {
	return !port.state || port.state === 'connected';
}

function getPortKey(port: MIDIPort, mapId: string): string | undefined {
	return port.id || mapId || undefined;
}

function getIndexedPortKey(kind: 'input' | 'output', portKey: string, indexesByKey: Map<string, number>): string {
	const indexedPortKey = `${kind}\u0000${portKey}`;
	let index = indexesByKey.get(indexedPortKey);
	if (index === undefined) {
		index = indexesByKey.size;
		indexesByKey.set(indexedPortKey, index);
	}

	return String(index);
}

function addInputPorts(
	info: InfoRecord,
	ports: MIDIInputMap,
	inputsByPort: Map<string, MIDIInput>,
	indexesByKey: Map<string, number>
): void {
	ports.forEach((port, mapId) => {
		if (!isConnectedPort(port)) {
			return;
		}

		const key = getPortKey(port, mapId);
		if (!key) {
			return;
		}

		const indexedKey = getIndexedPortKey('input', key, indexesByKey);
		info[indexedKey] = formatPortName(port, indexedKey) + ' (in)';
		inputsByPort.set(indexedKey, port);
	});
}

function addOutputPorts(info: InfoRecord, ports: MIDIOutputMap, indexesByKey: Map<string, number>): void {
	ports.forEach((port, mapId) => {
		if (!isConnectedPort(port)) {
			return;
		}

		const key = getPortKey(port, mapId);
		if (!key) {
			return;
		}

		const indexedKey = getIndexedPortKey('output', key, indexesByKey);
		info[indexedKey] = formatPortName(port, indexedKey) + ' (out)';
	});
}

function createMidiInfo(access: MIDIAccess, connectedDevices: ConnectedMidiDevices): InfoRecord {
	connectedDevices.inputsByPort.clear();

	const info: InfoRecord = {};
	const indexesByKey = new Map<string, number>();
	addInputPorts(info, access.inputs, connectedDevices.inputsByPort, indexesByKey);
	addOutputPorts(info, access.outputs, indexesByKey);
	return info;
}

export default function createMidiDeviceManager({
	store,
	navigator,
	onPortsChanged,
}: MidiDevicesOptions): MidiDeviceManager {
	const requestMIDIAccess = (navigator as unknown as { requestMIDIAccess?: Navigator['requestMIDIAccess'] })
		.requestMIDIAccess;
	const connectedDevices: ConnectedMidiDevices = {
		inputsByPort: new Map(),
	};
	let disposed = false;
	let midiAccess: MIDIAccess | undefined;
	let previousStateChangeHandler: MIDIAccess['onstatechange'] = null;

	function setMidiInfo(info: InfoRecord | undefined): void {
		store.set('info.midi', info);
	}

	function updateMidiInfo(): void {
		if (!midiAccess || disposed) {
			return;
		}

		setMidiInfo(createMidiInfo(midiAccess, connectedDevices));
		onPortsChanged?.();
	}

	if (typeof requestMIDIAccess !== 'function') {
		setMidiInfo({});
		return {
			getInputPort: () => undefined,
			dispose: () => {
				disposed = true;
				setMidiInfo(undefined);
				onPortsChanged?.();
			},
		};
	}

	setMidiInfo({});

	void requestMIDIAccess
		.call(navigator)
		.then(access => {
			if (disposed) {
				return;
			}

			midiAccess = access;
			previousStateChangeHandler = access.onstatechange;
			access.onstatechange = function (event) {
				previousStateChangeHandler?.call(access, event);
				updateMidiInfo();
			};
			updateMidiInfo();
		})
		.catch(() => {
			if (!disposed) {
				setMidiInfo({});
				onPortsChanged?.();
			}
		});

	return {
		getInputPort: port => connectedDevices.inputsByPort.get(port),
		dispose: () => {
			disposed = true;
			if (midiAccess) {
				midiAccess.onstatechange = previousStateChangeHandler;
			}
			connectedDevices.inputsByPort.clear();
			setMidiInfo(undefined);
			onPortsChanged?.();
		},
	};
}
