export interface MidiInBinding {
	port: string;
	exportName: string;
}

export type MidiInputLookup = (port: string) => MIDIInput | undefined;
