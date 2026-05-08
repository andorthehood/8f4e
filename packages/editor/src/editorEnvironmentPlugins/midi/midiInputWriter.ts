import { MIDI_INPUT_RECORD_WORDS } from './midiInputDirectives';

import type { MemoryViews } from '@8f4e/web-ui';
import type { MidiInputBinding } from './midiInputDirectives';

function canUseAtomics(view: Int32Array): boolean {
	return typeof SharedArrayBuffer !== 'undefined' && view.buffer instanceof SharedArrayBuffer;
}

function loadInt(view: Int32Array, index: number): number {
	if (index < 0 || index >= view.length) {
		return 0;
	}

	if (canUseAtomics(view)) {
		return Atomics.load(view, index);
	}

	return view[index] ?? 0;
}

function storeInt(view: Int32Array, index: number, value: number): void {
	if (index < 0 || index >= view.length) {
		return;
	}

	if (canUseAtomics(view)) {
		Atomics.store(view, index, value);
		return;
	}

	view[index] = value;
}

function incrementInt(view: Int32Array, index: number): void {
	storeInt(view, index, loadInt(view, index) + 1);
}

export function writeMidiInputRecord(
	memoryViews: MemoryViews,
	binding: MidiInputBinding,
	event: MIDIMessageEvent,
	sequence: number
): void {
	const view = memoryViews.int32;
	const readIndex = loadInt(view, binding.readIndexWordAddress);
	const writeIndex = loadInt(view, binding.writeIndexWordAddress);
	const normalizedWriteIndex = ((writeIndex % binding.capacity) + binding.capacity) % binding.capacity;
	const nextWriteIndex = (normalizedWriteIndex + 1) % binding.capacity;

	if (nextWriteIndex === readIndex) {
		incrementInt(view, binding.droppedWordAddress);
		return;
	}

	const data = event.data ?? new Uint8Array(0);
	const recordStart = binding.bufferWordAddress + normalizedWriteIndex * MIDI_INPUT_RECORD_WORDS;

	storeInt(view, recordStart, sequence);
	storeInt(view, recordStart + 1, data[0] ?? 0);
	storeInt(view, recordStart + 2, data[1] ?? 0);
	storeInt(view, recordStart + 3, data[2] ?? 0);
	storeInt(view, recordStart + 4, Math.trunc(event.timeStamp));
	storeInt(view, binding.writeIndexWordAddress, nextWriteIndex);
}
