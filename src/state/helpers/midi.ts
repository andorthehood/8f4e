const MIN_MIDI_NOTE = 0;
const MAX_MIDI_NOTE = 69;
const INT_16_MAX_NUMBER = 32767;
const INT_16_MIN_NUMBER = -32768;

export const int16ToMidiNote = function (num: number): number {
	num = Math.max(Math.min(num, INT_16_MAX_NUMBER), 0) / INT_16_MAX_NUMBER;
	return Math.floor(MIN_MIDI_NOTE + num * (MAX_MIDI_NOTE - MIN_MIDI_NOTE));
};

export const midiNoteToInt16 = function (num: number): number {
	num = Math.max(Math.min(num, MAX_MIDI_NOTE), MIN_MIDI_NOTE);
	return Math.floor((num / MAX_MIDI_NOTE) * INT_16_MAX_NUMBER);
};

export const getOneOctaveInInt16 = function () {
	return midiNoteToInt16(0) + midiNoteToInt16(12);
};
