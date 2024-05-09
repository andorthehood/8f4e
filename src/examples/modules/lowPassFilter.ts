import { ExampleModule } from '../../../packages/editor/src/state/types';

const lowPassFilter: ExampleModule = {
	title: 'Low-pass Filter',
	author: 'Andor Polgar',
	category: 'Filters',
	code: `module lowPassFilter

float* in &normalizer.out
float out

float alpha 0.1

push &out
 push alpha
 push *in
 mul

 push 1.0
 push alpha
 sub
 push out
 mul

 add 
store

moduleEnd`,
	tests: [],
};

export default lowPassFilter;
