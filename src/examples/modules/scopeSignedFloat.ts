import { ExampleModule } from '../../../packages/editor/src/state/types';

const scope: ExampleModule = {
	title: 'Scope (Signed, Float, -1-1)',
	author: 'Andor Polgar',
	category: 'Debug Tools',
	code: `module scope

float* in
float[] buffer 64
int bufferPointer &buffer

plot buffer -1 1

push &bufferPointer
push bufferPointer
push 4
add
store

push bufferPointer
push buffer&
greaterOrEqual
if void
 push &bufferPointer
 push &buffer
 store
end

push bufferPointer
push *in
store

end`,
	tests: [],
};

export default scope;
