import type { ExampleModule } from '@8f4e/editor-state';

const scope: ExampleModule = {
	title: 'Scope (Signed, Float, -1-1)',
	author: 'Andor Polgar',
	category: 'Debug Tools',
	code: `module scope

float* in
float[] buffer 64
int bufferPointer &buffer

# plot buffer -1 1

push &bufferPointer
push bufferPointer
push WORD_SIZE
add
store

push bufferPointer
push buffer&
greaterThan
if void
 push &bufferPointer
 push &buffer
 store
ifEnd

push bufferPointer
push *in
store

moduleEnd`,
	tests: [],
};

export default scope;
