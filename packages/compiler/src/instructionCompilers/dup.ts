import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const dup: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		const tempName = '__dupTemp' + line.lineNumber;

		context.stack.push(operand);

		return compileSegment(
			[
				`local ${operand.isInteger ? 'int' : 'float'} ${tempName}`,
				`localSet ${tempName}`,
				`localGet ${tempName}`,
				`localGet ${tempName}`,
			],
			context
		);
	}
);

export default dup;



if (import.meta.vitest) {
	const { describe, test, expect, beforeEach, beforeAll } = await import('vitest');
	const { createTestModule } = await import('./testUtils');

const dup = `module dup

int input 
int output1
int output2

push &output1
push &output2
push input
dup
store
store

moduleEnd
`;

// const fixtures: number[] = [69, 0, -420];

describe('dup', () => {
	let testModule: Awaited<ReturnType<typeof createTestModule>>;

	beforeAll(async () => {
		testModule = await createTestModule(dup);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated AST, WAT and memory map match the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
		expect(testModule.wat).toMatchSnapshot();
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	// test.each(fixtures)('', input => {
	// 	const { memory, test } = testModule;
	// 	memory.set('input', input);
	// 	test();
	// 	expect(memory.get('output1')).toBe(input);
	// 	expect(memory.get('output2')).toBe(input);
	// });
});
}
