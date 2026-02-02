import type { ExampleModule } from '@8f4e/editor-state';

const sampleAndHoldInt: ExampleModule = {
	title: 'Sample & Hold (Int)',
	author: 'Andor Polgar',
	category: 'Utils',
	code: `module sh

int* in
int* trigger
int out

# debug out

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

export default sampleAndHoldInt;
