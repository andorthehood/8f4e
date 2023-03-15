import { compile, compileToAST } from './compiler';

const fixture = `
module abs

# memory
memory int DEFAULT_VALUE -1
memory int* in:1 &DEFAULT_VALUE
memory int out 0
buffer int arr 32 -1

# registers
local input

# code
push out
push in:1
load
load
localSet input
localGet input
push 0
lessThan
if 
    push 0
    localGet input
    sub
else
    localGet input
end
store`.split('\n');

describe('moduleCompiler', () => {
	const ast = compileToAST(fixture);

	test('ast', () => {
		expect(ast).toMatchSnapshot();
	});

	test('compiled code', () => {
		expect(compile(ast, {}, 0).functionBody).toMatchSnapshot();
	});
});
