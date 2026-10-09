import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { compileInstructionForTest, createStackFacts } from '../testUtils';
import loadFloat from './loadFloat';

describe('loadFloat instruction compiler', () => {
	it('loads from a safe memory address', () => {
		const context = createInstructionCompilerTestContext();

		compileInstructionForTest(
			loadFloat,
			{
				lineNumber: 1,
				instruction: 'loadFloat',
				arguments: [],
			},
			context,
			createStackFacts({
				consumedOperands: [
					{
						kind: 'address',
						valueType: 'int',
						isNonZero: false,
						address: {
							memoryIndex: 0,
							safeRange: {
								source: 'memory-start',
								memoryIndex: 0,
								byteAddress: 0,
								safeByteLength: 4,
								memoryId: 'test',
							},
						},
					},
				],
			})
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('loads from an unsafe memory address with a bounds guard', () => {
		const context = createInstructionCompilerTestContext();

		compileInstructionForTest(
			loadFloat,
			{
				lineNumber: 2,
				instruction: 'loadFloat',
				arguments: [],
			},
			context,
			createStackFacts({ consumedOperands: [{ kind: 'value', valueType: 'int', isNonZero: false }] })
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
