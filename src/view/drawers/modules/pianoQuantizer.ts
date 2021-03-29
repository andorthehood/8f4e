import { pianoKeyboard } from '../../../../packages/spriteGenerator/src';

const getWhiteKeyIndex = function (note: number) {
	const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
	return whiteKeys.indexOf(note % 12) + Math.floor(note / 12) * 7;
};

const drawer = function (engine, config) {
	engine.setSpriteLookup(pianoKeyboard());

	for (let i = 0; i < 8; i++) {
		engine.drawSprite(140 * i, 40);
	}

	const activeNotes = Object.keys(config)
		.filter(key => key.startsWith('note') && config[key])
		.map(note => parseInt(note.split(':')[1], 10))
		.slice(0, 12);

	engine.setSpriteLookup(pianoKeyboard(true));

	for (let i = 0; i < activeNotes.length; i++) {
		engine.drawSprite(getWhiteKeyIndex(activeNotes[i]) * 20, 40, activeNotes[i]);
	}
};

export default drawer;
