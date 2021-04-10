import { pianoKeyboard } from '../../../../packages/spriteGenerator/src';

const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
const blackKeys = [1, 3, 6, 8, 10];
const blackKeyPositions = [14, 34, 74, 94, 114];
const allKeys = [...whiteKeys, ...blackKeys];
const whiteKeyWidth = 18;
const spacing = 2;
const keyboardWidth = whiteKeyWidth * whiteKeys.length + spacing * whiteKeys.length;

const getWhiteKeyIndex = function (note: number): number {
	return whiteKeys.indexOf(note % allKeys.length);
};

const getBlackKeyIndex = function (note: number): number {
	return blackKeys.indexOf(note % allKeys.length);
};

const drawer = function (engine, config) {
	engine.setSpriteLookup(pianoKeyboard());

	for (let i = 0; i < 10; i++) {
		engine.drawSprite(140 * i, 38, undefined);
	}

	const activeNotes = Object.keys(config)
		.filter(key => key.startsWith('note') && config[key])
		.map(note => parseInt(note.split(':')[1], 10))
		.slice(0, 12);

	engine.setSpriteLookup(pianoKeyboard(true));

	for (let i = 0; i < activeNotes.length; i++) {
		const index = getWhiteKeyIndex(activeNotes[i]);
		if (index !== -1) {
			const octaveNumber = Math.floor(activeNotes[i] / 12) * 7;
			engine.drawSprite((index + octaveNumber) * 20, 38, activeNotes[i]);
		} else {
			const blackIndex = getBlackKeyIndex(activeNotes[i]);
			const octave = Math.floor(activeNotes[i] / 12);
			engine.drawSprite(blackKeyPositions[blackIndex] + octave * keyboardWidth, 38, activeNotes[i]);
		}
	}
};

export default drawer;
