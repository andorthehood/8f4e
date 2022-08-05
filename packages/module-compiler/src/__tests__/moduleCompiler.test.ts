import { compile } from '..';

const fixture1 = `
# abs module

# memory
private DEFAULT_VALUE 0
inputPointer in DEFAULT_VALUE
output out 0

# registers
local input

# code
const out
const in
load
load
localSet input
localGet input
const 0
lessThan
if 
    const 0
    localGet input
    sub
else
    localGet input
end
store`;

const fixture2 = `
private zero 0
inputPointer in zero
private divisor 1
output out 0

const out
const in
load
load
const divisor
load
div
store
`;

describe('moduleCompiler', () => {
	test('compile', () => {
		expect(compile(fixture1, 'a', 0).functionBody).toMatchSnapshot();
	});

	test('compile', () => {
		expect(compile(fixture2, 'a', 0).functionBody).toMatchSnapshot();
	});
});
