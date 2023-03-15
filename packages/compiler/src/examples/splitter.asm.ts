export default `module splitter

memory int zero 0
memory int* in &zero
memory int out:1 &zero
memory int out:2 &zero
memory int out:3 &zero
memory int out:4 &zero

local input

push *in
localSet input

push &out:1
push input
store

push &out:2
push input
store

push &out:3
push input
store

push &out:4
push input
store
`;
