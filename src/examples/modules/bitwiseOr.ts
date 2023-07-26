import { ExampleModule } from '../../../packages/editor/src/state/types';

const bitwiseOr: ExampleModule = {
	title: 'Bitwise OR',
	author: 'Andor Polgar',
	category: 'Bitwise',
	code: `module bitwiseAnd
         ;   -----.
int* in1 ; --+     '
int out  ;   )  or  |---
int* in2 ; --+     .
         ;   -----'

push &out
push *in1
push *in2
or
store

end`,
	tests: [],
};

export default bitwiseOr;
