import type { ExampleModule } from '@8f4e/editor-state';

const bpmClock: ExampleModule = {
	title: 'BPM Clock',
	author: 'Andor Polgar',
	category: 'Clock',
	code: `module bpmClock

int bpm 120
int out
int counter 

debug counter

push &out
push 0
store

push counter
push SAMPLE_RATE
push 60
mul
push bpm
ensureNonZero
div
greaterThan
if void
push &counter
push 0
store
push &out
push 1
store
ifEnd

push &counter
push counter
push 1
add
store

moduleEnd`,
	tests: [],
};

export default bpmClock;
