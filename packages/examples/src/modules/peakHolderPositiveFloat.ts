import type { ExampleModule } from '@8f4e/editor-state';

const peakHolderPositiveFloat: ExampleModule = {
	title: 'Peak Holder (Positive, Float)',
	author: 'Andor Polgar',
	category: 'Debug Tools',
	code: `module peakHolder

float* in
float out

; @debug out

push *in
push out
greaterThan
if void
 push &out
 push *in
 store
ifEnd

moduleEnd`,
	tests: [],
};

export default peakHolderPositiveFloat;
