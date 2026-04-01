import { BLOCK_TYPE } from '../types';

import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { allocateInternalResource } from '../utils/internalResources';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `loop`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const loop: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.LOOP,
		});

		const infiniteLoopProtectionCounterName = '__infiniteLoopProtectionCounter' + line.lineNumberAfterMacroExpansion;
		const loopErrorSignalerName = '__loopErrorSignaler';
		const loopErrorSignaler = allocateInternalResource(context, loopErrorSignalerName, 'int', -1);

		return compileSegment(
			[
				`local int ${infiniteLoopProtectionCounterName}`,

				'push 0',
				`localSet ${infiniteLoopProtectionCounterName}`,

				`wasm ${WASMInstruction.BLOCK}`,
				`wasm ${Type.VOID}`,

				`wasm ${WASMInstruction.LOOP}`,
				`wasm ${Type.VOID}`,

				`localGet ${infiniteLoopProtectionCounterName}`,
				'push 1000',
				'greaterOrEqual',
				'if void',
				` push ${loopErrorSignaler.byteAddress}`,
				` push ${line.lineNumberBeforeMacroExpansion}`,
				' store',
				` branch 2`,
				'ifEnd',
				`localGet ${infiniteLoopProtectionCounterName}`,
				'push 1',
				'add',
				`localSet ${infiniteLoopProtectionCounterName}`,
			],
			context
		);
	}
);

export default loop;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('loop instruction compiler', () => {
		it('compiles the loop segment', () => {
			const context = createInstructionCompilerTestContext();

			loop(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'loop',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				memory: context.namespace.memory,
				locals: context.locals,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
