import type { ExampleModule } from '@8f4e/editor-state';

const sequencerFloat: ExampleModule = {
	title: 'Sequencer (Float)',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module sequencer

float step0 
float step1
float step2 
float step3
float step4
float step5
float step6
float _last 

float* stepPointer &step1
int* trigger

float out

; Increment step pointer
push *trigger
risingEdge 
if void
push &stepPointer
push stepPointer
push %step1
add
store
ifEnd

; Guard
push stepPointer
push &_last
greaterThan
if void
push &stepPointer
push &step1
store
ifEnd

push &out
push *stepPointer
store 

moduleEnd`,
	tests: [],
};

export default sequencerFloat;
