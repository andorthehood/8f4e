import { ArgumentType } from '../types';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const ensureNonZero: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push(operand);

		let defaultNonZeroValue = operand.isInteger ? '1' : '1.0';

		// If the operand is float we convert the argument to a float string.
		if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && !operand.isInteger) {
			defaultNonZeroValue = line.arguments[0].value.toFixed(1);
		}

		// If the operand is integer we convert the argument to an integer string.
		if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && operand.isInteger) {
			defaultNonZeroValue = line.arguments[0].value.toString();
		}

		const tempVariableName = '__ensureNonZero_temp_' + line.lineNumber;

		if (operand.isInteger) {
			const ret = compileSegment(
				[
					`local int ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`localGet ${tempVariableName}`,
					'equalToZero',
					'if int',
					`push ${defaultNonZeroValue}`,
					'else',
					`localGet ${tempVariableName}`,
					'ifEnd',
				],
				context
			);
			context.stack.pop();
			context.stack.push({ isInteger: true, isNonZero: true });
			return ret;
		} else {
			const ret = compileSegment(
				[
					`local float ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`localGet ${tempVariableName}`,
					'equalToZero',
					'if float',
					`push ${defaultNonZeroValue}`,
					'else',
					`localGet ${tempVariableName}`,
					'ifEnd',
				],
				context
			);
			context.stack.pop();
			context.stack.push({ isInteger: false, isNonZero: true });
			return ret;
		}
	}
);

export default ensureNonZero;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'ensureNonZero (int)',
	`module ensureNonZero
int input 
int output
    
push &output
push input
ensureNonZero
store
    
moduleEnd
`,
	[
		[{ input: 69 }, { output: 69 }],
		[{ input: 0 }, { output: 1 }],
		[{ input: -420 }, { output: -420 }],
	]
);

moduleTester(
	'ensureNonZero (float)',
	`module ensureNonZero
float input 
float output
    
push &output
push input
ensureNonZero
store
    
moduleEnd
`,
	[
		[{ input: 69.1 }, { output: 69.1 }],
		[{ input: 0 }, { output: 1.0001 }],
		[{ input: -420.1 }, { output: -420.1 }],
	]
);
}
