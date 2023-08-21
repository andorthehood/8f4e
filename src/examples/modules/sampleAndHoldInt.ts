import { ExampleModule } from '../../../packages/editor/src/state/types';

const sampleAndHoldInt: ExampleModule = {
	title: 'Sample & Hold (Int)',
	author: 'Andor Polgar',
	category: 'Utils',
	code: `module sh

int* in
int* trigger
int out

debug out

push *trigger
risingEdge
if void
 push &out
 push *in
 store
end

end`,
	tests: [],
};

export default sampleAndHoldInt;
