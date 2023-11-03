import { ExampleModule } from '../../../packages/editor/src/state/types';

const changeDetectorInt: ExampleModule = {
	title: 'Change Detector (Int)',
	author: 'Andor Polgar',
	category: 'Trigger',
	code: `module change2Trig

const HIGH 1
const LOW 0

int* in &sh.out
int trigOut
int prevValue

push &trigOut
push LOW
store

push prevValue
push *in
equal
if void
else
 push &trigOut
 push HIGH
 store
end

push &prevValue
push *in
store

moduleEnd`,
	tests: [],
};

export default changeDetectorInt;
