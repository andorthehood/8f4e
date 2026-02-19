import type { ExampleModule } from '@8f4e/editor-state';

const masterClock: ExampleModule = {
	title: 'Master Clock',
	author: 'Andor Polgar',
	category: 'Clock',
	code: `module clock

const HIGH 1
const LOW 0

int out

push &out
push out
push HIGH
equal
if int
push LOW
else
push HIGH
ifEnd
store

moduleEnd`,
	tests: [],
};

export default masterClock;
