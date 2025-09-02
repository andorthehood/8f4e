import type { ExampleModule } from '../../../packages/editor/src/state/types';

const bitwiseAnd: ExampleModule = {
	title: 'Bitwise AND',
	author: 'Andor Polgar',
	category: 'Bitwise',
	code: `module bitwiseAnd
         ;   .----.
int* in1 ; --+     '
int out  ;   | and  |---
int* in2 ; --+     .
         ;   '----'

push &out
push *in1
push *in2
and
store

moduleEnd`,
	tests: [],
};

export default bitwiseAnd;
