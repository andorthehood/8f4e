import { ExampleModule } from '../../../packages/editor/src/state/types';

const sequentialMuxFloat: ExampleModule = {
	title: 'Sequential Multiplexer (8 input, Float)',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module seqMux

float* in0
float* in1 
float* in2
float* in3
float* in4
float* in5
float* in6
float* in7

int _length 8 ; default
int* trigger
int* length &_length

float out

int counter

push *trigger
risingEdge
if void 
 ; Increment counter
 push &counter
  push counter
  push 1
  add
 store
end

; Guard
push counter
push *length
greaterOrEqual
if void
 push &counter
  push 0
 store
end

push &out
 ; Calculate input address
 push &in0
 push counter
 push WORD_SIZE
 mul
 add

 ; Load value
 load
 load
store

end`,
	tests: [],
};

export default sequentialMuxFloat;
