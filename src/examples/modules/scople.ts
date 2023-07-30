import { ExampleModule } from '../../../packages/editor/src/state/types';

const scope: ExampleModule = {
	title: 'Scope',
	author: 'Andor Polgar',
	category: 'Debug Tools',
	code: `module scope

int* in &sawInt8bit.out 
int[] buffer 64
int bufferPointer &buffer

plot buffer 0 256

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
