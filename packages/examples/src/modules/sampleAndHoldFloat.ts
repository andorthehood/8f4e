import type { ExampleModule } from '@8f4e/editor-state';

const sampleAndHoldFloat: ExampleModule = {
	title: 'Sample & Hold (Float)',
	author: 'Andor Polgar',
	category: 'Utils',
	code: `module sh

float* in
int* trigger
float out

; @debug out

push *trigger
risingEdge
if void
push &out
push *in
store
ifEnd

moduleEnd`,
	tests: [],
};

export default sampleAndHoldFloat;
