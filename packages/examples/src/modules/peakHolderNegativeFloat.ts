import type { ExampleModule } from '@8f4e/editor-state';

const peakHolderNegativeFloat: ExampleModule = {
	title: 'Peak Holder (Negative, Float)',
	author: 'Andor Polgar',
	category: 'Debug Tools',
	code: `module peakHolder

float* in
float out

; @debug out

push *in
push out
lessThan
if void
push &out
push *in
store
ifEnd

moduleEnd`,
	tests: [],
};

export default peakHolderNegativeFloat;
