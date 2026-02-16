import type { ExampleModule } from '@8f4e/editor-state';

const euclideanRhythm: ExampleModule = {
	title: 'Euclidean Rhythm',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module euclideanRhythm

int[] rhythm 16
int pulses 4

int _bucket
int _index
int _beat

; Reset state
push &_bucket
push 0
store

push &_index
push 0
store

; Generate rhythm into buffer
loop
 push _index
 push $rhythm
 greaterOrEqual
 branchIfTrue 1

 push &_bucket
 push _bucket
 push pulses
 add
 store

 push &_beat
 push 0
 store

 push _bucket
 push $rhythm
 greaterOrEqual
 if void
  push &_bucket
  push _bucket
  push $rhythm
  sub
  store

  push &_beat
  push 1
  store
 ifEnd

 push &rhythm
 push _index
 push %rhythm
 mul
 add
 push _beat
 store

 push &_index
 push _index
 push 1
 add
 store
loopEnd

moduleEnd`,
	tests: [],
};

export default euclideanRhythm;
