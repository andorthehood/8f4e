import { I16_SIGNED_LARGEST_NUMBER } from 'compiler';

const MIN_MIDI_NOTE = 0;
const MAX_MIDI_NOTE = 69;

export const int16ToMidiNote = function (num: number): number {
	num = Math.max(Math.min(num, I16_SIGNED_LARGEST_NUMBER), 0) / I16_SIGNED_LARGEST_NUMBER;
	return Math.floor(MIN_MIDI_NOTE + num * (MAX_MIDI_NOTE - MIN_MIDI_NOTE));
};

export const midiNoteToInt16 = function (num: number): number {
	num = Math.max(Math.min(num, MAX_MIDI_NOTE), MIN_MIDI_NOTE);
	return Math.floor((num / MAX_MIDI_NOTE) * I16_SIGNED_LARGEST_NUMBER);
};

export const getOneOctaveInInt16 = function () {
	return midiNoteToInt16(0) + midiNoteToInt16(12);
};
