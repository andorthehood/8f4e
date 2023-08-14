import { ExampleModule } from '../../../packages/editor/src/state/types';

const bufferIntToFloat: ExampleModule = {
	title: 'Int Buffer to Float Buffer Converter',
	author: 'Andor Polgar',
	category: 'Buffer',
	code: `module bufferI2F

int* bufferIn
int* lengthIn
float[] buffer 16 ; size
int length
int pointer

push &length
push *lengthIn
store

push &pointer
push 0
store

loop
 ; Guard
 push pointer
 push length
 greaterOrEqual
 branchIfTrue 1 
 
 ; Calculate destination
 ; address
 push &buffer
 push pointer
 push WORD_SIZE
 mul
 add

 ; Calculate source
 ; address
 push bufferIn
 push pointer
 push WORD_SIZE
 mul
 add
 
 load ; value from src
 
 castToFloat

 store ; value to dst
 
 ; Increment buffer pointer
 push &pointer
 push pointer
 push 1
 add
 store
end

end`,
	tests: [],
};

export default bufferIntToFloat;
