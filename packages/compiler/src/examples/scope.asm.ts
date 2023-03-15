const BUFFER_LENGTH = 64;

export default `module scope

memory int defaultValue 0
memory int* in &defaultValue
memory int out 0

memory int counter 0
memory int rate 0
buffer int buffer ${BUFFER_LENGTH} 0
memory int bufferPointer &buffer

local _bufferPointer
local _counter
local _input

push *in
localSet _input

push &out
push _input
store

push counter
localSet _counter

push _counter
push rate
greaterOrEqual
if void
 push &counter
 push 0
 store
else
 push _counter
 push 1
 add
 localSet _counter
 
 push &counter
 push _counter
 store
 branch 1
end

push bufferPointer
localSet _bufferPointer

push _bufferPointer
push _input
store

# Increment the value of the the buffer pointer.
push _bufferPointer
push ${Int32Array.BYTES_PER_ELEMENT}
add
localSet _bufferPointer

# Prevent the buffer pointer access out of bounds memory.
push _bufferPointer
 push &buffer
 push ${BUFFER_LENGTH * Int32Array.BYTES_PER_ELEMENT}
 add
greaterOrEqualUnsigned
if void
 push &buffer
 localSet _bufferPointer
end

push &bufferPointer
push _bufferPointer
store
`;
