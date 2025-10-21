import type { ExampleModule } from '@8f4e/editor-state';

const bitwiseXor: ExampleModule = {
	title: 'Bitwise XOR',
	author: 'Andor Polgar',
	category: 'Bitwise',
	code: `module bitwiseAnd
         ;  \\\\----.
int* in1 ; --+     '
int out  ;   )) xor |---
int* in2 ; --+     .
         ;  //----'

push &out
push *in1
push *in2
xor
store

moduleEnd`,
	tests: [],
};

export default bitwiseXor;
