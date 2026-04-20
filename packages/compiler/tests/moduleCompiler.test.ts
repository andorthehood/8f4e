import { compileToAST } from '@8f4e/tokenizer';
import { createPublicMemoryPassResultFromASTs } from '@8f4e/compiler-memory-layout';
import { createSymbolPassResultFromASTs } from '@8f4e/compiler-symbols';
import { describe, test, expect } from 'vitest';

import { compileModule } from '../src/compiler';

const fixture = `
module abs

; memory
int defaultValue -1
int* in:1 &defaultValue
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
push input
push 0
lessThan
if
    push 0
    push input
    sub
else
    push input
ifEnd int
store
moduleEnd`.split('\n');

describe('moduleCompiler', () => {
	const ast = compileToAST(fixture);

	test('ast', () => {
		expect(ast).toMatchSnapshot();
	});

	test('compiled code', () => {
		const symbolPassResult = createSymbolPassResultFromASTs([ast]);
		const publicMemoryPassResult = createPublicMemoryPassResultFromASTs([ast], {
			symbolPassResult,
			startingByteAddress: 0,
		});
		const moduleName = ast[0].arguments[0].value;
		expect(
			compileModule(
				ast,
				symbolPassResult.namespaces,
				publicMemoryPassResult.modules,
				0,
				1,
				publicMemoryPassResult.modulePlans[moduleName],
				undefined,
				{ nextByteAddress: publicMemoryPassResult.requiredPublicMemoryBytes },
				symbolPassResult
			).cycleFunction
		).toMatchSnapshot();
	});
});
