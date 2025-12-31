import type { ExampleModule } from '@8f4e/editor-state';

const arEnvelope: ExampleModule = {
	title: 'Attack-Release Envelope',
	author: 'Andor Polgar',
	category: 'Envelopes',
	code: `module arEnv
; Attack-Release (AR)
; Envelope Generator

float dAttack 0.001
float dRelease 0.001

int* trigger

float* attackRate &dAttack
float* releaseRate &dRelease
float out

int attacking 0

push *trigger
risingEdge
if void
push &attacking
push 1
store
ifEnd

push attacking
push 0
greaterThan
if void
push &out
push out
push *attackRate
add
store
else
push &out
push out
push *releaseRate
sub
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

push out
push 0.0
lessThan
if void
push &out
push 0.0
store
ifEnd

moduleEnd`,
	tests: [],
};

export default arEnvelope;
