import type { CodeError } from '@8f4e/editor-state-types';

export interface MidiInBinding {
	port: string;
	exportName: string;
	lineNumber: number;
	codeBlockId: string | number;
	codeBlockType?: CodeError['codeBlockType'];
}

export type MidiInputLookup = (port: string) => MIDIInput | undefined;
