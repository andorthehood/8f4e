import type { ExampleModule } from '@8f4e/editor-state';

const triggerPatternSequencer: ExampleModule = {
	title: 'Trigger Pattern Sequencer',
	author: 'Andor Polgar',
	category: 'Sequencers',
	code: `module triggerPatternSequencer

int* trigger
int* bufferIn    ; &module.buffer
int* bufferEndIn ; module.buffer&

int _offset
int out

; Default output low every cycle.
push &out
push 0
store

push *trigger
risingEdge
if void
 ; Read current pattern value:
 ; *(bufferIn + _offset)
 push bufferIn
 push _offset
 add
 load
 if void
  push &out
  push 1
  store
 ifEnd

 ; Advance by element size
 push &_offset
 push _offset
 push %bufferIn
 add
 store

 ; Wrap when element address
 push bufferIn
 push _offset
 add
 push bufferEndIn
 greaterThan
 if void
  push &_offset
  push 0
  store
 ifEnd
ifEnd

moduleEnd`,
	tests: [],
};

export default triggerPatternSequencer;
