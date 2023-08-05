import { ExampleModule } from '../../../packages/editor/src/state/types';

const mulInt: ExampleModule = {
	title: 'Multiple (8x Int)',
	author: 'Andor Polgar',
	category: 'Utilities',
	code: `module mulInt

int* in
int out0
int out1
int out2
int out3
int out4
int out5
int out6
int out7

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

export default mulInt;
