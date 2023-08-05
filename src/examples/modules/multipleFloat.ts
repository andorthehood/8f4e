import { ExampleModule } from '../../../packages/editor/src/state/types';

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

int pointer

push &pointer
push 0
store

loop
 ; Exit point
 push pointer
 push 7
 greaterThan
 branchIfTrue 1
 
 ; Calc. output address
 push &out0
 push pointer
 push WORD_SIZE
 mul
 add
 push *in
 store 

 ; Increment pointer
 push &pointer
 push pointer
 push 1
 add
 store
end`,
	tests: [],
};

export default mulFloat;
