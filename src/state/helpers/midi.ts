import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from 'compiler';

const MAX_MIDI_NOTE = 127;

export const int16ToMidiNote = function (num: number): number {
	num = (num - I16_SIGNED_SMALLEST_NUMBER) / (I16_SIGNED_LARGEST_NUMBER * 2);

	return Math.floor(num * MAX_MIDI_NOTE);
};

export const midiNoteToInt16 = function (num: number): number {
	return Math.floor((num / MAX_MIDI_NOTE) * (I16_SIGNED_LARGEST_NUMBER * 2) - I16_SIGNED_LARGEST_NUMBER);
};

export const getOneOctaveInInt16 = function () {
	return midiNoteToInt16(0) + midiNoteToInt16(12);
};
