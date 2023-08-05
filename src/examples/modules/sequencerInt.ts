import { ExampleModule } from '../../../packages/editor/src/state/types';

const sequencerInt: ExampleModule = {
	title: 'Sequencer (Int)',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module sequencerF

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

push *trigger
risingEdge 
if void
 push &stepPointer
 push stepPointer
 push WORD_SIZE
 add
 store
end

; Guard
push stepPointer
push &_last
greaterThan
if void
 push &stepPointer
 push &step1
 store
end

push &out
push *stepPointer
store 

end`,
	tests: [],
};

export default sequencerInt;
