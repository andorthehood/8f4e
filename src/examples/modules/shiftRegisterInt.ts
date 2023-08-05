import { ExampleModule } from '../../../packages/editor/src/state/types';

const shiftRegisterInt: ExampleModule = {
	title: 'Shift Register (8 outs, Int)',
	author: 'Andor Polgar',
	category: 'Utilities',
	code: `module shiftRegI

int* in
int* trigger

int out0
int out1
int out2
int out3
int out4
int out5
int out6
int last

int* pointer &out0

push *trigger
risingEdge
if void
 ; Reset pointer
 push &pointer
 push &last
 store

 loop
  ; Guard
  push pointer
  push &out0
  equal
  branchIfTrue 1
  
  ; Copy value from prev
  ; register to the curr
  push pointer 
  push pointer
  push WORD_SIZE
  sub
  load
  store

  ; Increment pointer
  push &pointer
  push pointer
  push WORD_SIZE
  sub
  store

 end ; loop
 
 ; Copy the input value
 ; to the first register
 push &out0
 push *in
 store
 
end

end`,
	tests: [],
};

export default shiftRegisterInt;
