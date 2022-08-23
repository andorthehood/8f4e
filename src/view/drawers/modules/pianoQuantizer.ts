import { Engine } from '@8f4e/2d-engine';
import { MemoryAddressLookup, MemoryBuffer } from '@8f4e/synth-compiler';
import { Memory } from '@8f4e/synth-compiler/dist/modules/quantizer';
import { pianoKeyboard } from '@8f4e/sprite-generator';
import { Module } from '../../../state/types';
import { HGRID, VGRID } from '../consts';
import { PianoQuantizer } from '../../../modules/pianoQuantizer120';

const octaveWidth = 12 * HGRID;

export default function pianoDrawer(
	engine: Engine,
	module: Module,
	moduleType: PianoQuantizer,
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
			2 * VGRID * moduleType.precalculatedValues.notes.get(activeNotes[i]) + config.x,
			config.y,
			moduleType.precalculatedValues.keyNumbers.get(activeNotes[i])
		);
	}

	engine.setSpriteLookup(pianoKeyboard(false, true));

	engine.drawSprite(
		2 * VGRID * moduleType.precalculatedValues.notes.get(outValue) + config.x,
		config.y,
		moduleType.precalculatedValues.keyNumbers.get(outValue)
	);
}
