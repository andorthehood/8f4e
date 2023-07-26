import { ExampleModule } from '../../../packages/editor/src/state/types';

const quantizer: ExampleModule = {
	title: 'Quantizer',
	author: 'Andor Polgar',
	category: 'Quantizers',
	code: `module quantizer

use midiCodes

float* in

float level1 A0
float level2 A1
float level3 A2
float level4 A3
float level5 A4

float* firstLevel &level1
float* lastLevel &level5
float* levelPointer &level1

float bestMatchingValue
float difference
float smallestDifference 1000

push &smallestDifference
push 1000.0
store

loop
 push &levelPointer
 push firstLevel
 push lastLevel
 cycle 

 ; Calculate difference between
 ; the input and the current
 ; level.
 push &difference
 push *levelPointer
 push *in
 sub
 abs
 store

 push difference
 push smallestDifference
 lessOrEqual
 if void
  ; If it's actually smaller
  ; than the smallest difference,
  ; then update the smallest 
  ; difference.
  push &smallestDifference
  push difference
  store
  ; Save the current level value.
  push &bestMatchingValue
  push *levelPointer
  store
 end
 
 ; Exit loop if the level pointer
 ; reached the end.
 push levelPointer
 push lastLevel
 equal
 branchIfTrue 1
end

end`,
	tests: [],
};

export default quantizer;
