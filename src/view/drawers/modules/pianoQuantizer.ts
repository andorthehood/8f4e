import { pianoKeyboard } from '../../../../packages/spriteGenerator/src';

const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
const blackKeys = [1, 3, 6, 8, 10];

const getWhiteKeyIndex = function (note: number): number {
	return whiteKeys.indexOf(note % 12);
};

const getBlackKeyIndex = function (note: number): number {
	return blackKeys.indexOf(note % 12);
};

const drawer = function (engine, config) {
	engine.setSpriteLookup(pianoKeyboard());

	for (let i = 0; i < 9; i++) {
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
			const octaveNumber = Math.floor(activeNotes[i] / 12) * 5;
			engine.drawSprite((blackIndex + octaveNumber) * 20 + 14, 38, activeNotes[i]);
		}
	}
};

export default drawer;
