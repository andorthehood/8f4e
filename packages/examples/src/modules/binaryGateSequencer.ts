import type { ExampleModule } from '@8f4e/editor-state';

const binaryGateSequencer: ExampleModule = {
	title: 'Binary Gate Sequencer',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module binaryGateSeq

int step1  0b10100000
int step2  0b00100000
int step3  0b10100000
int tesp4  0b00100000
int step5  0b01100000
int step6  0b00100000
int step7  0b10100000
int step8  0b01100000
int step9  0b00100000
int step10 0b01100000
int step11 0b10100000
int step12 0b01100000
int step13 0b01100000
int step14 0b10100000
int step15 0b00100000
int last   0b01100000

int* stepPointer &step1
int* trigger

int out1
int out2
int out3 
int out4
int out5 
int out6
int out7 
int out8 

int bitPointer 0

const HIGH 1
const LOW 0

; Increment step pointer
push *trigger
risingEdge
if void
push &stepPointer
push &step1
push &last
cycle
ifEnd

push &bitPointer
push 0
store

loop
; Exit loop if bitPointer
; is greater than 7
push bitPointer
push 7
greaterThan
branchIfTrue 1
 
; Calculate output address
push &out1
push bitPointer
push %out1
mul
add

push *stepPointer
push 0b10000000
push bitPointer
shiftRight
and
if int
push HIGH
else
push LOW
ifEnd 

store

; Increment bitPointer
push &bitPointer
push bitPointer
push 1
add
store

loopEnd

moduleEnd`,
	tests: [],
};

export default binaryGateSequencer;
