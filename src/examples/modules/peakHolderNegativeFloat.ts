import { ExampleModule } from '../../../packages/editor/src/state/types';

const peakHolderNegativeFloat: ExampleModule = {
	title: 'Peak Holder (Negative, Float)',
	author: 'Andor Polgar',
	category: 'Debug Tools',
	code: `module peakHolder

float* in
float out

debug out

push *in
push out
lessThan
if void
 push &out
 push *in
 store
end

end`,
	tests: [],
};

export default peakHolderNegativeFloat;
