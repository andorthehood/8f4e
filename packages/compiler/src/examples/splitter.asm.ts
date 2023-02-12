export default `module splitter

memory zero 0
memory in &zero
memory out:1 &zero
memory out:2 &zero
memory out:3 &zero
memory out:4 &zero

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
