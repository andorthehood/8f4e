import { I32_SIGNED_LARGEST_NUMBER } from '../consts';
import { ModuleStateInserter, ModuleStateExtractor } from '../types';

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

export default ({ allocatedNotes }) => `
	inputPointer in 0
	output out 0
    public allocatedNotes ${allocatedNotes}
	public numberOfNotes 0
	array notes ${allocatedNotes} -1 

	local bestMatchingValue
	local difference
	local _in
	local noteMemoryPointer
	local noteValue
	local smallestDifference
	local notesEndAddressPointer

	push in
	localSet _in

	# Calculate the address of the last note.
	push numberOfNotes
	push 4
	mul
	pushRef notes
	add
	localSet notesEndAddressPointer

	# Set the smallest difference to the largest 32bit signed number.
	push ${I32_SIGNED_LARGEST_NUMBER}
	localSet smallestDifference

	# Set the note memory pointer to the start address
	pushRef notes
	localSet noteMemoryPointer

	block void
		loop void
			# Branch if the memory pointer would overflow.
			push noteMemoryPointer
			push notesEndAddressPointer
			greaterOrEqualUnsigned
			branchIfTrue 1

			# Load a note value from the memory.
			push noteMemoryPointer
			load
			localSet noteValue

			# Calculate difference between input and the note.
			push noteValue
			push _in
			sub
			localSet difference

			# Calculate abs
			push difference
			push 0
			lessThan
			if 
				push 0
				push difference
				sub
			else
				push difference
			end
			localSet difference

			# Compare with the smallest difference.
			push difference
			push smallestDifference
			lessOrEqual
			if void
				# If it's actually smaller than the previusly recorded
				# smallest difference, then overwirte it and save the
				# current note value.			
				push difference
				localSet smallestDifference
				push noteValue
				localSet bestMatchingValue
			end

			# Increment the note memory pointer by 4 (i32 is 4 bytes)
			push noteMemoryPointer
			push 4
			add
			localSet noteMemoryPointer
		loopEnd
	end

	# Prepare memory address for storing the output value.
	pushRef out
	push bestMatchingValue
	store
`;
