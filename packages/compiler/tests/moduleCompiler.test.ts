import { describe, test, expect } from 'vitest';

import { compileModule, compileToAST } from '../src/compiler';

const fixture = `
module abs

; memory
int DEFAULT_VALUE -1
int* in:1 &DEFAULT_VALUE
int out 0
int[] arr 32 -1

; registers
local int input

; code
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
	ifEnd
store
moduleEnd`.split('\n');

describe('moduleCompiler', () => {
	const ast = compileToAST(fixture);

	test('ast', () => {
		expect(ast).toMatchSnapshot();
	});

	test('compiled code', () => {
		expect(compileModule(ast, {}, {}, 0, 1, 0).cycleFunction).toMatchSnapshot();
	});
});
