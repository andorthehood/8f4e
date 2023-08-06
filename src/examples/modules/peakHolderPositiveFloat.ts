import { ExampleModule } from '../../../packages/editor/src/state/types';

const peakHolderPositiveFloat: ExampleModule = {
	title: 'Peak Holder (Positive, Float)',
	author: 'Andor Polgar',
	category: 'Debug Tools',
	code: `module peakHolder

float* in
float out

debug out

push *in
push out
greaterThan
if void
 push &out
 push *in
 store
end

end`,
	tests: [],
};

export default peakHolderPositiveFloat;
