import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '@8f4e/synth-compiler';

const MAX_MIDI_NOTE = 127;

export function int16ToMidiNote(num: number): number {
	num = (num - I16_SIGNED_SMALLEST_NUMBER) / (I16_SIGNED_LARGEST_NUMBER * 2);

	return Math.floor(num * MAX_MIDI_NOTE);
}

export function midiNoteToInt16(num: number): number {
	return Math.floor((num / MAX_MIDI_NOTE) * (I16_SIGNED_LARGEST_NUMBER * 2) - I16_SIGNED_LARGEST_NUMBER);
}

export function getOneOctaveInInt16(): number {
	return midiNoteToInt16(0) + midiNoteToInt16(12);
}
