import type { InfoRecord } from '@8f4e/editor-state-types';

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

export default function createMidiInfo(access: MIDIAccess): InfoRecord {
	const info: InfoRecord = {};

	addPorts(info, access.inputs, 'input');
	addPorts(info, access.outputs, 'output');
	return info;
}
