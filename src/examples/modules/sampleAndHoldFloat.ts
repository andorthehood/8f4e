import type { ExampleModule } from '../../../packages/editor/src/state/types';

const sampleAndHoldFloat: ExampleModule = {
	title: 'Sample & Hold (Float)',
	author: 'Andor Polgar',
	category: 'Utils',
	code: `module sh

float* in
int* trigger
float out

debug out

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
