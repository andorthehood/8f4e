// Web MIDI API Type Definitions
// Based on W3C Web MIDI API specification

declare global {
	interface MIDIOptions {
		sysex?: boolean;
		software?: boolean;
	}

	interface MIDIAccess extends EventTarget {
		readonly inputs: MIDIInputMap;
		readonly outputs: MIDIOutputMap;
		readonly sysexEnabled: boolean;
		onstatechange: ((this: MIDIAccess, ev: MIDIConnectionEvent) => void) | null;
	}

	interface MIDIPort extends EventTarget {
		readonly id: string;
		readonly manufacturer: string | null;
		readonly name: string | null;
		readonly type: 'input' | 'output';
		readonly version: string | null;
		readonly state: 'disconnected' | 'connected';
		readonly connection: 'open' | 'closed' | 'pending';
		onstatechange: ((this: MIDIPort, ev: MIDIConnectionEvent) => void) | null;
		open(): Promise<MIDIPort>;
		close(): Promise<MIDIPort>;
	}

	interface MIDIInput extends MIDIPort {
		readonly type: 'input';
		onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => void) | null;
	}

	interface MIDIOutput extends MIDIPort {
		readonly type: 'output';
		send(data: number[] | Uint8Array, timestamp?: number): void;
		clear(): void;
	}

	interface MIDIInputMap extends ReadonlyMap<string, MIDIInput> {}

	interface MIDIOutputMap extends ReadonlyMap<string, MIDIOutput> {}

	interface MIDIMessageEvent extends Event {
		readonly data: Uint8Array | null;
		readonly timeStamp: number;
	}

	interface MIDIConnectionEvent extends Event {
		readonly port: MIDIPort | null;
	}

	interface Navigator {
		requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
	}
}

export {};
