import { ExampleModule } from '../../../packages/editor/src/state/types';

const sequencerFloat: ExampleModule = {
	title: 'Sequencer (Float)',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module sequencerF

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

export default sequencerFloat;
