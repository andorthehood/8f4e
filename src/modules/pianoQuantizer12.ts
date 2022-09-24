import { Config, extractState, insertState } from '@8f4e/synth-compiler/dist/modules/quantizer.asm';
import chordIdentifier from '@8f4e/chord-identifier';

import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import generatePianoKeyLayout from './helpers/generatePianoKeyLayout';

import { Button, ButtonClickHandler, ModuleType } from '../state/types';
import { int16ToMidiNote, midiNoteToInt16 } from '../state/helpers/midi';
import { HGRID, VGRID } from '../view/drawers/consts';

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const onButtonClick: ButtonClickHandler = function (module, memoryBuffer, memoryAddressLookup, value) {
	const { activeNotes } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);

	if (activeNotes.includes(midiNoteToInt16(value))) {
		for (let i = 0; i < 12; i++) {
			activeNotes.splice(activeNotes.indexOf(midiNoteToInt16(value + i * 12)), 1);
		}
	} else {
		for (let i = 0; i < 12; i++) {
			activeNotes.push(midiNoteToInt16(value + i * 12));
		}
	}

	module.state.chord = chordIdentifier(activeNotes.map(int16ToMidiNote));

	insertState({ activeNotes }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export type PianoQuantizer = ModuleType<
	Config,
	{
		keyCount: number;
		x: number;
		y: number;
		notes: Map<number, number>;
		noteSigns: Map<number, string>;
	}
>;

export default function pianoQuantizer(): PianoQuantizer {
	const width = HGRID * 15;
	const height = HGRID * 8;
	const pianoX = VGRID * 3;
	const pianoY = HGRID * 2;
	const keyCount = 12;

	return {
		buttons: [
			...generatePianoKeyLayout<Button>({ keyCount }, ({ index, x, y, ...rest }) => {
				return {
					id: 'note:' + index,
					value: index,
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
				notes: new Map(new Array(127).fill(0).map((item, index) => [midiNoteToInt16(index), index % 12])),
				noteSigns: new Map(new Array(127).fill(0).map((item, index) => [midiNoteToInt16(index), notes[index % 12]])),
			},
		},
		engine: { name: 'quantizer', config: { allocatedNotes: 120 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in', label: '' }]),
		name: 'Quantizer 12',
		outputs: addDefaultOutputPositions([{ id: 'out', label: '' }], width),
		insertState,
		extractState,
		sliders: [],
		steppers: [],
		width,
	};
}
