import { Engine } from '2d-engine';
import { ModuleState } from 'compiler';
import { pianoKeyboard } from 'sprite-generator';

const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
const blackKeys = [1, 3, 6, 8, 10];
const blackKeyPositions = [14, 34, 74, 94, 114];
const allKeys = [...whiteKeys, ...blackKeys];
const whiteKeyWidth = 18;
const spacing = 2;
const keyboardWidth = whiteKeyWidth * whiteKeys.length + spacing * whiteKeys.length;

function getWhiteKeyIndex(note: number): number {
	return whiteKeys.indexOf(note % allKeys.length);
}

function getBlackKeyIndex(note: number): number {
	return blackKeys.indexOf(note % allKeys.length);
}

export default function pianoDrawer(engine: Engine, state: ModuleState, vGrid: number, hGrid: number): void {
	engine.setSpriteLookup(pianoKeyboard());

	for (let i = 0; i < 10; i++) {
		engine.drawSprite(140 * i + vGrid, hGrid * 4.5, undefined);
	}

	const activeNotes = Object.keys(state)
		.filter(key => key.startsWith('note') && state[key])
		.map(note => parseInt(note.split(':')[1], 10));

	engine.setSpriteLookup(pianoKeyboard(true));

	for (let i = 0; i < activeNotes.length; i++) {
		const index = getWhiteKeyIndex(activeNotes[i]);
		if (index !== -1) {
			const octaveNumber = Math.floor(activeNotes[i] / 12) * 7;
			engine.drawSprite((index + octaveNumber) * 20 + vGrid, hGrid * 4.5, activeNotes[i]);
		} else {
			const blackIndex = getBlackKeyIndex(activeNotes[i]);
			const octave = Math.floor(activeNotes[i] / 12);
			engine.drawSprite(blackKeyPositions[blackIndex] + octave * keyboardWidth + vGrid, hGrid * 4.5, activeNotes[i]);
		}
	}
}
