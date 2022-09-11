import { font } from '@8f4e/sprite-generator';
import { Engine } from '@8f4e/2d-engine';
import { MemoryAddressLookup, MemoryBuffer } from '@8f4e/synth-compiler';
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
	const config = moduleType.drawer.config;
	const outAddress = moduleAddress + 1;
	const notesAddress = moduleAddress + 4;
	const numberOfNotesAddress = moduleAddress + 3;
	const numberOfNotes = memoryBuffer[numberOfNotesAddress];
	const activeNotes = memoryBuffer.slice(notesAddress, notesAddress + Math.min(numberOfNotes, config.keyCount));
	const outValue = memoryBuffer[outAddress];

	for (let i = 0; i < Math.floor(config.keyCount / 12); i++) {
		engine.drawSprite(octaveWidth * i + config.x, config.y, undefined);
	}

	engine.setSpriteLookup(pianoKeyboard(true));

	for (let i = 0; i < activeNotes.length; i++) {
		engine.drawSprite(
			2 * VGRID * config.notes.get(activeNotes[i]) + config.x,
			config.y,
			config.keyNumbers.get(activeNotes[i])
		);
	}

	engine.setSpriteLookup(pianoKeyboard(false, true));
	engine.drawSprite(2 * VGRID * config.notes.get(outValue) + config.x, config.y, config.keyNumbers.get(outValue));

	engine.setSpriteLookup(font('small_white'));
	engine.drawText(VGRID * 18, HGRID, 'chord: ' + (module.state.chord ? module.state.chord : '-'));
	engine.drawText(VGRID * 30, HGRID, 'out: ' + (config.noteSigns.has(outValue) ? config.noteSigns.get(outValue) : '-'));
}
