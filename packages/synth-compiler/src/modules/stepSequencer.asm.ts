import { ModuleStateExtractor, ModuleStateInserter } from '../types';

interface QuantizerState {
	activeNotes: number[];
}

export const extractState: ModuleStateExtractor<QuantizerState> = function extractState(
	memoryBuffer,
	moduleAddress
): QuantizerState {
	const firstNoteAddress = moduleAddress + 4;
	const numberOfNotesAddress = moduleAddress + 3;
	return {
		activeNotes: Array.from(
			memoryBuffer.slice(firstNoteAddress, firstNoteAddress + memoryBuffer[numberOfNotesAddress])
		),
	};
};

export const insertState: ModuleStateInserter<QuantizerState> = function insertState(
	state,
	memoryBuffer,
	moduleAddress
): void {
	const firstNoteAddress = moduleAddress + 4;
	const numberOfNotesAddress = moduleAddress + 3;
	const allocatedNotesAddress = moduleAddress + 2;
	const allocatedNotes = memoryBuffer[allocatedNotesAddress];

	state.activeNotes.slice(0, allocatedNotes).forEach((note, index) => {
		memoryBuffer[firstNoteAddress + index] = note;
	});

	memoryBuffer[numberOfNotesAddress] = Math.min(state.activeNotes.length, allocatedNotes);
};

export interface Config {
	allocatedNotes?: number;
}

export default ({ allocatedNotes = 12 } = {}) => `
	inputPointer step 0
    private stepPreviousValue 0
	output out 0
    private allocatedNotes ${allocatedNotes}
	public numberOfNotes 0
	array notes ${allocatedNotes} -1 

    local _step

    push step
    setLocal _step

    # Detect rising edge
    push _step
    push stepPreviousValue
    greaterThan
    if
        push 

`;
