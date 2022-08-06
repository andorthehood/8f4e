import { Engine } from '@8f4e/2d-engine';
import { MemoryAddressLookup, MemoryBuffer } from '@8f4e/compiler';
import { Memory } from 'compiler/dist/modules/quantizer';
import { pianoKeyboard } from 'sprite-generator';
import { int16ToMidiNote } from '../../../state/helpers/midi';
import { Module, ModuleType } from '../../../state/types';

const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
const blackKeys = [1, 3, 6, 8, 10];
const blackKeyPositions = [13, 33, 73, 93, 113];
const allKeys = [...whiteKeys, ...blackKeys];
const allNotes = new Array(128).fill(0).map((item, index) => index);
const whiteKeyWidth = 18;
const spacing = 2;
const keyboardWidth = whiteKeyWidth * whiteKeys.length + spacing * whiteKeys.length;
const octaveWidth = 140;

function getWhiteKeyIndex(note: number): number {
	return whiteKeys.indexOf(note % allKeys.length);
}

function getBlackKeyIndex(note: number): number {
	return blackKeys.indexOf(note % allKeys.length);
}

const keyPositions = allNotes.map(note => {
	const whiteKeyIndex = getWhiteKeyIndex(note);

	if (whiteKeyIndex === -1) {
		const octaveNumber = Math.floor(note / 12);
		const blackKeyIndex = getBlackKeyIndex(note);
		return blackKeyPositions[blackKeyIndex] + octaveNumber * keyboardWidth;
	} else {
		const octaveNumber = Math.floor(note / 12) * 7;
		return (whiteKeyIndex + octaveNumber) * 20;
	}
});

export default function pianoDrawer(
	engine: Engine,
	module: Module,
	moduleType: ModuleType,
	memoryAddressLookup: MemoryAddressLookup,
	memoryBuffer: MemoryBuffer
): void {
	engine.setSpriteLookup(pianoKeyboard());

	const moduleAddress = memoryAddressLookup[module.id].__startAddress;
	const config: { x: number; y: number; keyCount: number } = moduleType.drawer.config;
	const outAddress = moduleAddress + Memory.OUTPUT;
	const notesAddress = moduleAddress + Memory.FIRST_NOTE;
	const numberOfNotesAddress = moduleAddress + Memory.NUMBER_OF_NOTES;
	const numberOfNotes = memoryBuffer[numberOfNotesAddress];
	const activeNotes = memoryBuffer.slice(notesAddress, notesAddress + Math.min(numberOfNotes, config.keyCount));
	const outValue = memoryBuffer[outAddress];

	for (let i = 0; i < Math.floor(config.keyCount / 12); i++) {
		engine.drawSprite(octaveWidth * i + config.x, config.y, undefined);
	}

	engine.setSpriteLookup(pianoKeyboard(true));

	for (let i = 0; i < activeNotes.length; i++) {
		engine.drawSprite(
			keyPositions[int16ToMidiNote(activeNotes[i])] + config.x,
			config.y,
			int16ToMidiNote(activeNotes[i])
		);
	}

	engine.setSpriteLookup(pianoKeyboard(false, true));

	engine.drawSprite(keyPositions[int16ToMidiNote(outValue)] + config.x, config.y, int16ToMidiNote(outValue));
}
