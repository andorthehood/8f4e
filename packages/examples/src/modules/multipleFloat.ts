import type { ExampleModule } from '@8f4e/editor-state';

const mulFloat: ExampleModule = {
	title: 'Multiple (8x Float)',
	author: 'Andor Polgar',
	category: 'Utilities',
	code: `module mulFloat

float* in
float out0
float out1
float out2
float out3
float out4
float out5
float out6
float out7

float* _pointer &out0

push &_pointer
push &out0
store

loop
push _pointer
push *in
store 

 ; Exit point
push _pointer
push &out7; Last output
equal
branchIfTrue 1

 ; Increment pointer
push &_pointer
push _pointer
push %out0
add
store
loopEnd
moduleEnd`,
	tests: [],
};

export default mulFloat;
