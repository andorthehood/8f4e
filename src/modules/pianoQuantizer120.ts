import chordIdentifier from '@8f4e/chord-identifier';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';
import source, { extractState, insertState, State } from './engines/quantizer.asm';

import { Button, ButtonClickHandler, ModuleType } from '../state/types';
import { int16ToMidiNote, midiNoteToInt16 } from '../state/helpers/midi';
import { HGRID, VGRID } from '../view/drawers/consts';

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const onButtonClick: ButtonClickHandler = function (module, memoryBuffer, memoryAddressLookup, value) {
	const { activeNotes } = extractState(memoryBuffer, memoryAddressLookup.get(module.id + '__startAddress'));

	if (activeNotes.includes(value)) {
		activeNotes.splice(activeNotes.indexOf(value), 1);
	} else {
		activeNotes.push(value);
	}

	module.state.chord = chordIdentifier(activeNotes.map(int16ToMidiNote));

	insertState({ activeNotes }, memoryBuffer, memoryAddressLookup.get(module.id + '__startAddress'));
};

export type PianoQuantizer = ModuleType<
	{
		keyCount: number;
		x: number;
		y: number;
		notes: Map<number, number>;
		noteSigns: Map<number, string>;
	},
	State
>;

export default function pianoQuantizer(): PianoQuantizer {
	const width = HGRID * 123;
	const height = HGRID * 8;
	const pianoX = VGRID * 3;
	const pianoY = HGRID * 2;
	const keyCount = 120;

	return {
		buttons: [
			...generatePianoKeyLayout<Button>({ keyCount }, ({ index, x, y, ...rest }) => {
				return {
					id: 'note:' + index,
					value: midiNoteToInt16(index),
					onClick: onButtonClick,
					x: x + pianoX,
					y: y + pianoY,
					...rest,
				};
			}),
		],
		category: 'Quantizer',
		drawer: {
			name: 'piano',
			config: {
				keyCount,
				x: pianoX,
				y: pianoY,
				notes: new Map(new Array(keyCount).fill(0).map((item, index) => [midiNoteToInt16(index), index])),
				noteSigns: new Map(
					new Array(keyCount).fill(0).map((item, index) => [midiNoteToInt16(index), notes[index % 12]])
				),
			},
		},
		engine: { source: source({ allocatedNotes: 32 }) },
		height,
		initialState: { activeNotes: [] },
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		name: 'Quantizer 120',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		insertState,
		extractState,
		width,
	};
}
