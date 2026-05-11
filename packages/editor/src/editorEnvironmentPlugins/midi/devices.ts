import type { StateManager } from '@8f4e/state-manager';
import type { InfoRecord, State } from '@8f4e/editor-state-types';

interface MidiDevicesOptions {
	store: StateManager<State>;
	navigator: Navigator;
	onPortsChanged?: () => void;
}

interface MidiPortRegistry {
	inputsByIndex: Map<string, MIDIInput>;
	indexesByKey: Map<string, number>;
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

function getPortIndex(kind: 'input' | 'output', portKey: string, indexesByKey: Map<string, number>): string {
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
	inputsByIndex: Map<string, MIDIInput>,
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

		const index = getPortIndex('input', key, indexesByKey);
		info[index] = formatPortName(port, index) + ' (in)';
		inputsByIndex.set(index, port);
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

		const index = getPortIndex('output', key, indexesByKey);
		info[index] = formatPortName(port, index) + ' (out)';
	});
}

function createMidiInfo(access: MIDIAccess, portRegistry: MidiPortRegistry): InfoRecord {
	portRegistry.inputsByIndex.clear();

	const info: InfoRecord = {};
	addInputPorts(info, access.inputs, portRegistry.inputsByIndex, portRegistry.indexesByKey);
	addOutputPorts(info, access.outputs, portRegistry.indexesByKey);
	return info;
}

export default function createMidiDeviceManager({
	store,
	navigator,
	onPortsChanged,
}: MidiDevicesOptions): MidiDeviceManager {
	const requestMIDIAccess = (navigator as unknown as { requestMIDIAccess?: Navigator['requestMIDIAccess'] })
		.requestMIDIAccess;
	const portRegistry: MidiPortRegistry = {
		inputsByIndex: new Map(),
		indexesByKey: new Map(),
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

		setMidiInfo(createMidiInfo(midiAccess, portRegistry));
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
		getInputPort: port => portRegistry.inputsByIndex.get(port),
		dispose: () => {
			disposed = true;
			if (midiAccess) {
				midiAccess.onstatechange = previousStateChangeHandler;
			}
			portRegistry.inputsByIndex.clear();
			portRegistry.indexesByKey.clear();
			setMidiInfo(undefined);
			onPortsChanged?.();
		},
	};
}
