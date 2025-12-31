import type { ExampleModule } from '@8f4e/editor-state';

const asEnvelope: ExampleModule = {
	title: 'Attack-Release Envelope',
	author: 'Andor Polgar',
	category: 'Envelopes',
	code: `module asEnv
; Attack-Sustain (AS)
; Envelope Generator

float dAttack 0.001

int* trigger
float* attackRate &dAttack
float out

int attacking 0

debug out

push *trigger
risingEdge
if void

push &attacking
push 1
store

push &out
push 0.0
store

ifEnd

push attacking
push 0
greaterThan
if void
push &out
push out
push 0.001
add
store
ifEnd

push out
push 1.0
greaterThan
if void
push &attacking
push 0
store
ifEnd

moduleEnd`,
	tests: [],
};

export default asEnvelope;
