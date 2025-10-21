import type { ExampleModule } from '@8f4e/editor-state-types';

const sequencerInt: ExampleModule = {
	title: 'Sequencer (Int)',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module sequencer

int step0 
int step1
int step2 
int step3
int step4
int step5
int step6
int _last 

int* stepPointer &step1
int* trigger

int out

; Increment step pointer
push *trigger
risingEdge 
if void
 push &stepPointer
 push stepPointer
 push WORD_SIZE
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

export default sequencerInt;
