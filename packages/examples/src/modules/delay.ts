import type { ExampleModule } from '@8f4e/editor-state';

const delay: ExampleModule = {
	title: 'Delay',
	author: 'Andor Polgar',
	category: 'Effects',
	code: `module delay

float[] buffer 44100
int length 4400
float* in
float out
int pointer &buffer

# debug pointer

push &out
 push pointer
 loadFloat
store

push pointer
 push *in
store

push &pointer
 push pointer
 push %pointer
 add
store

push pointer
push &buffer
push length
add
greaterThan
if void
 push &pointer
 push &buffer
 store
ifEnd

moduleEnd`,
	tests: [],
};

export default delay;
