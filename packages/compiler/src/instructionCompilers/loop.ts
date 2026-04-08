import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { BLOCK_TYPE } from '../types';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { allocateInternalResource } from '../utils/internalResources';
import { ArgumentType } from '../types';

import type { AST, InstructionCompiler, LoopLine } from '../types';

const DEFAULT_LOOP_CAP = 1000;

/**
 * Instruction compiler for `loop`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const loop: InstructionCompiler<LoopLine> = withValidation(
	{
		scope: 'moduleOrFunction',
		argumentTypes: ['nonNegativeIntegerLiteral'],
	},
	(line, context) => {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.LOOP,
		});

		const capArg = line.arguments[0];
		const effectiveCap =
			capArg !== undefined && capArg.type === ArgumentType.LITERAL
				? (capArg.value as number)
				: (context.loopCap ?? DEFAULT_LOOP_CAP);

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

				`push ${infiniteLoopProtectionCounterName}`,
				`push ${effectiveCap}`,
				'greaterOrEqual',
				'if',
				` push ${loopErrorSignaler.byteAddress}`,
				` push ${line.lineNumberBeforeMacroExpansion}`,
				' store',
				` branch 2`,
				'ifEnd',
				`push ${infiniteLoopProtectionCounterName}`,
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
		it('compiles the loop segment with default cap', () => {
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

		it('compiles the loop segment with explicit cap argument', () => {
			const context = createInstructionCompilerTestContext();

			loop(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'loop',
					arguments: [{ type: ArgumentType.LITERAL, value: 32, isInteger: true }],
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

		it('uses context.loopCap when no argument is provided', () => {
			const context = createInstructionCompilerTestContext();
			context.loopCap = 500;

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

		it('explicit argument overrides context.loopCap', () => {
			const context = createInstructionCompilerTestContext();
			context.loopCap = 500;

			loop(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'loop',
					arguments: [{ type: ArgumentType.LITERAL, value: 10, isInteger: true }],
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
