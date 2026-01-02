import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `hasChanged`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const hasChanged: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		const operand = context.stack.pop()!;

		const currentValueName = '__hasChangedDetector_currentValue' + line.lineNumber;
		const previousValueName = '__hasChangedDetector_previousValue' + line.lineNumber;
		const memoryType = operand.isInteger ? 'int' : 'float';

		context.stack.push({ isInteger: operand.isInteger, isNonZero: false });

		return compileSegment(
			[
				`${memoryType} ${previousValueName} 0`,
				`local ${memoryType} ${currentValueName}`,
				`localSet ${currentValueName}`,
				`localGet ${currentValueName}`,
				`push &${previousValueName}`,
				operand.isInteger ? 'load' : 'loadFloat',
				'equal',
				'equalToZero',
				`push &${previousValueName}`,
				`localGet ${currentValueName}`,
				'store',
			],
			context
		);
	}
);

export default hasChanged;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasChanged instruction compiler', () => {
		it('compiles the change detector segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			hasChanged({ lineNumber: 3, instruction: 'hasChanged', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				memory: context.namespace.memory,
				locals: context.namespace.locals,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
