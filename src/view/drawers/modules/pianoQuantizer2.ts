import { Engine } from '2d-engine';
import { MemoryAddressLookup, MemoryBuffer } from 'compiler';
import { Memory } from 'compiler/dist/modules/quantizer';
import { pianoKeyboard } from 'sprite-generator';
import { Module, ModuleType } from '../../../state/types';

const octaveWidth = 12 * 16;

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

	//engine.setSpriteLookup(pianoKeyboard(true));

	// for (let i = 0; i < activeNotes.length; i++) {
	// 	engine.drawSprite(
	// 		keyPositions[int16ToMidiNote(activeNotes[i])] + config.x,
	// 		config.y,
	// 		int16ToMidiNote(activeNotes[i])
	// 	);
	// }

	//engine.setSpriteLookup(pianoKeyboard(false, true));

	//engine.drawSprite(keyPositions[int16ToMidiNote(outValue)] + config.x, config.y, int16ToMidiNote(outValue));
}
