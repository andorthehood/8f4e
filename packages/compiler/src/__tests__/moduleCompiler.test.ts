import { compileToAST, compile } from '../moduleCompiler';

const fixture = `
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

describe('moduleCompiler', () => {
	test('compileToAST', () => {
		expect(compileToAST(fixture)).toMatchSnapshot();
	});

	test('compile', () => {
		const ast = compileToAST(fixture);
		expect(compile(ast, 'a', 0).byteCode).toMatchSnapshot();
	});
});
