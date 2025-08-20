// MIDI Web API type declarations
declare interface Navigator {
	requestMIDIAccess(): Promise<MIDIAccess>;
}

declare interface MIDIAccess extends EventTarget {
	inputs: MIDIInputMap;
	outputs: MIDIOutputMap;
}

declare interface MIDIInputMap extends Map<string, MIDIInput> {}
declare interface MIDIOutputMap extends Map<string, MIDIOutput> {}

declare interface MIDIInput extends EventTarget {
	id: string;
	name: string;
	manufacturer: string;
	state: string;
	type: string;
	version: string;
	onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

declare interface MIDIOutput {
	id: string;
	name: string;
	manufacturer: string;
	state: string;
	type: string;
	version: string;
	send(data: Uint8Array | number[], timestamp?: number): void;
}

declare interface MIDIMessageEvent extends Event {
	data: Uint8Array;
}
