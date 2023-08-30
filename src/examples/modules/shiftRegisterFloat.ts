import { ExampleModule } from '../../../packages/editor/src/state/types';

const shiftRegisterFloat: ExampleModule = {
	title: 'Shift Register (8 outs, Float)',
	author: 'Andor Polgar',
	category: 'Utilities',
	code: `module shiftReg

float* in
int* trigger

float out0
float out1
float out2
float out3
float out4
float out5
float out6
float last

float* pointer &out0

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

export default shiftRegisterFloat;
