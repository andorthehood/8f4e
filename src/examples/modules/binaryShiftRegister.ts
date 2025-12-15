import type { ExampleModule } from '@8f4e/editor-state';

const binaryShiftRegister: ExampleModule = {
	title: 'Binary Shift Register',
	author: 'Andor Polgar',
	category: 'Bitwise',
	code: `module binShiftReg

int* in
int* trigger

int out

push *trigger
risingEdge
if void
push &out
push out
push 1
shiftLeft
push *in
or
store
ifEnd

moduleEnd`,
	tests: [],
};

export default binaryShiftRegister;
