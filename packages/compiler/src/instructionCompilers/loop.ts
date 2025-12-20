import { BLOCK_TYPE } from '../types';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

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

		const infiniteLoopProtectionCounterName = '__infiniteLoopProtectionCounter' + line.lineNumber;
		const loopErrorSignalerName = '__loopErrorSignaler';

		return compileSegment(
			[
				`local int ${infiniteLoopProtectionCounterName}`,
				Object.hasOwn(context.namespace.memory, infiniteLoopProtectionCounterName)
					? ''
					: `int ${loopErrorSignalerName} -1`,

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
				` push &${loopErrorSignalerName}`,
				` push ${line.lineNumber}`,
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
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'loop',
	`module loop
int counter

loop
 push counter
 push 10
 equal
 branchIfTrue 1

 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 10 }]]
);

moduleTester(
	'infinite loop protection',
	`module loop
int counter

loop
 push &counter
 push counter
 push 1
 add
 store
loopEnd

moduleEnd
`,
	[[{}, { counter: 1000 }]]
);
}
