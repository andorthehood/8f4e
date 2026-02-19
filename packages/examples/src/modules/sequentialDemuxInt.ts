import type { ExampleModule } from '@8f4e/editor-state';

const sequentialDemuxInt: ExampleModule = {
	title: 'Sequential Demultiplexer (8 output, Int)',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module seqDemux

int _length 8

int* in
int* trigger
int* length &_length

int counter

int out0
int out1
int out2
int out3
int out4
int out5
int out6
int out7

push *trigger
risingEdge
if void
 ; Clear previous output
push &out0
push counter
push %out0
mul
add
push 0
store
 
 ; Increment counter
push &counter
push counter
push 1
add
store
ifEnd

; Guard
push counter
push *length
greaterOrEqual
if void
push &counter
push 0
store
ifEnd
 
; Calculate output address
push &out0
push counter
push %out0
mul
add
push *in
store

moduleEnd`,
	tests: [],
};

export default sequentialDemuxInt;
