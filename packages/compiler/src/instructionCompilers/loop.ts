import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { compileSegment } from '../compiler';
import { ArgumentType, BLOCK_TYPE } from '../types';
import { allocateInternalResource } from '../utils/internalResources';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, LoopLine } from '../types';

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
		const capArg = line.arguments[0];
		const effectiveCap =
			capArg !== undefined && capArg.type === ArgumentType.LITERAL
				? (capArg.value as number)
				: (context.loopCap ?? DEFAULT_LOOP_CAP);

		const infiniteLoopProtectionCounterName = '__infiniteLoopProtectionCounter' + line.lineNumberAfterMacroExpansion;
		const loopErrorSignalerName = '__loopErrorSignaler';
		const loopErrorSignaler = allocateInternalResource(context, loopErrorSignalerName, 'int', -1);

		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.LOOP,
			loopCounterLocalName: infiniteLoopProtectionCounterName,
		});

		// compileSegment is used here because loop initialization requires both a local
		// variable declaration (which needs the semantic pipeline) and a block of
		// instructions that set up the loop counter and infinite-loop guard; the
		// overall structure genuinely benefits from composed instruction semantics.
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
