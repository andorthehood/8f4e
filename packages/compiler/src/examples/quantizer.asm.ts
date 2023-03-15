export default `module quantizer

memory int* in 0
memory int out 0
memory int allocatedNotes 12
memory int numberOfNotes 0
buffer int notes 12 -1 

local bestMatchingValue
local difference
local _in
local noteMemoryPointer
local noteValue
local smallestDifference
local notesEndAddressPointer

push *in
localSet _in

# Calculate the address of the last note.
push numberOfNotes
push 4
mul
push &notes
add
localSet notesEndAddressPointer

# Set the smallest difference to the largest 32bit signed number.
push I32_SIGNED_LARGEST_NUMBER
localSet smallestDifference

# Set the note memory pointer to the start address
push &notes
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

  push noteMemoryPointer
  push WORD_SIZE
  add
  localSet noteMemoryPointer
 loopEnd
end

# Prepare memory address for storing the output value.
push &out
push bestMatchingValue
store
`;
