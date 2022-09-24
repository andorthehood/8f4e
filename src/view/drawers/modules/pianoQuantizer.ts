import { font } from '@8f4e/sprite-generator';
import { Engine } from '@8f4e/2d-engine';
import { MemoryAddressLookup, MemoryBuffer } from '@8f4e/synth-compiler';
import { pianoKeyboard } from '@8f4e/sprite-generator';

import { PianoQuantizer } from '../../../modules/pianoQuantizer120';
import { HGRID, VGRID } from '../consts';
import { Module } from '../../../state/types';

const octaveWidth = 12 * HGRID;

export default function pianoDrawer(
	engine: Engine,
	module: Module,
	moduleType: PianoQuantizer,
	memoryAddressLookup: MemoryAddressLookup,
	memoryBuffer: MemoryBuffer
): void {
	const moduleAddress = memoryAddressLookup[module.id].__startAddress;
	const config = moduleType.drawer.config;
	const outAddress = moduleAddress + 1;
	const notesAddress = moduleAddress + 4;
	const numberOfNotesAddress = moduleAddress + 3;
	const numberOfNotes = memoryBuffer[numberOfNotesAddress];
	const activeNotes = memoryBuffer.slice(notesAddress, notesAddress + numberOfNotes);
	const outValue = memoryBuffer[outAddress];

	engine.setSpriteLookup(pianoKeyboard());

	for (let i = 0; i < Math.floor(config.keyCount / 12); i++) {
		engine.drawSprite(octaveWidth * i + config.x, config.y, undefined);
	}

	engine.setSpriteLookup(pianoKeyboard(true));

	for (let i = 0; i < activeNotes.length; i++) {
		engine.drawSprite(
			2 * VGRID * config.notes.get(activeNotes[i]) + config.x,
			config.y,
			config.notes.get(activeNotes[i]) % 12
		);
	}

	engine.setSpriteLookup(pianoKeyboard(false, true));
	engine.drawSprite(2 * VGRID * config.notes.get(outValue) + config.x, config.y, config.notes.get(outValue) % 12);

	engine.setSpriteLookup(font('white'));
	engine.drawText(VGRID * 18, 0, 'chord: ' + (module.state.chord ? module.state.chord : '-'));
	engine.drawText(VGRID * 30, 0, 'out: ' + (config.noteSigns.has(outValue) ? config.noteSigns.get(outValue) : '-'));
}
