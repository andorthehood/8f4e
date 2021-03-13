import { Note } from '../midi/enums';
import { midiNoteToInt16 } from '../state/helpers/midi';
import { ModuleType } from '../state/types';

const pianoQuantizer: ModuleType = {
	width: 200,
	height: 100,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out', x: 185, y: 20 },
	],
	switches: [
		{ id: 'note1', onValue: midiNoteToInt16(Note.C0), offValue: -2147483648, x: 40, y: 42, width: 10, height: 10 },
		{
			id: 'note2',
			onValue: midiNoteToInt16(Note.C0_SHARP),
			offValue: -2147483648,
			x: 50,
			y: 30,
			width: 10,
			height: 10,
		},
		{ id: 'note3', onValue: midiNoteToInt16(Note.D0), offValue: -2147483648, x: 60, y: 42, width: 10, height: 10 },
		{
			id: 'note4',
			onValue: midiNoteToInt16(Note.D0_SHARP),
			offValue: -2147483648,
			x: 70,
			y: 30,
			width: 10,
			height: 10,
		},
		{ id: 'note5', onValue: midiNoteToInt16(Note.E0), offValue: -2147483648, x: 80, y: 42, width: 10, height: 10 },
		{ id: 'note6', onValue: midiNoteToInt16(Note.F0), offValue: -2147483648, x: 90, y: 42, width: 10, height: 10 },
		{
			id: 'note7',
			onValue: midiNoteToInt16(Note.F0_SHARP),
			offValue: -2147483648,
			x: 100,
			y: 30,
			width: 10,
			height: 10,
		},
		{ id: 'note8', onValue: midiNoteToInt16(Note.G0), offValue: -2147483648, x: 110, y: 42, width: 10, height: 10 },
		{
			id: 'note9',
			onValue: midiNoteToInt16(Note.G0_SHARP),
			offValue: -2147483648,
			x: 120,
			y: 30,
			width: 10,
			height: 10,
		},
		{
			id: 'note10',
			onValue: midiNoteToInt16(Note.A0),
			offValue: -2147483648,
			x: 130,
			y: 42,
			width: 10,
			height: 10,
		},
		{
			id: 'note11',
			onValue: midiNoteToInt16(Note.A0_SHARP),
			offValue: -2147483648,
			x: 140,
			y: 30,
			width: 10,
			height: 10,
		},
		{
			id: 'note12',
			onValue: midiNoteToInt16(Note.B0),
			offValue: -2147483648,
			x: 150,
			y: 42,
			width: 10,
			height: 10,
		},
	],
	name: 'Quantizer',
	sliders: [],
	steppers: [],
	engine: 'quantizer',
};

export default pianoQuantizer;
