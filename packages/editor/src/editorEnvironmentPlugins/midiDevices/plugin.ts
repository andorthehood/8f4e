import type { InfoRecord } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';

type MidiDeviceDirection = 'input' | 'output';

function formatPortName(port: MIDIPort, fallback: string): string {
	const name = port.name?.trim();

	return name || fallback;
}

function addPorts(info: InfoRecord, map: MIDIInputMap | MIDIOutputMap, type: MidiDeviceDirection): void {
	map.forEach((port, mapId) => {
		if (port.state && port.state !== 'connected') {
			return;
		}

		const id = port.id || mapId;

		if (!id) {
			return;
		}

		info[id] = formatPortName(port, id) + (type === 'input' ? ' (in)' : ' (out)');
	});
}

function createMidiInfo(access: MIDIAccess): InfoRecord {
	const info: InfoRecord = {};

	addPorts(info, access.inputs, 'input');
	addPorts(info, access.outputs, 'output');
	return info;
}

export default function midiDevicesPlugin({ store, navigator }: EditorEnvironmentPluginContext): () => void {
	const requestMIDIAccess = (navigator as unknown as { requestMIDIAccess?: Navigator['requestMIDIAccess'] })
		.requestMIDIAccess;
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

		setMidiInfo(createMidiInfo(midiAccess));
	}

	if (typeof requestMIDIAccess !== 'function') {
		setMidiInfo({});
		return () => {
			disposed = true;
			setMidiInfo(undefined);
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
			}
		});

	return () => {
		disposed = true;
		if (midiAccess) {
			midiAccess.onstatechange = previousStateChangeHandler;
		}
		setMidiInfo(undefined);
	};
}
