import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, MapBeginLine } from '../types';

/**
 * Instruction compiler for `mapBegin`.
 * Opens a map block scope and records the input type for the mapping operation.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const mapBegin: InstructionCompiler<MapBeginLine> = withValidation<MapBeginLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line: MapBeginLine, context) => {
		const inputType = line.arguments[0].value;

		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.MAP,
			mapState: {
				inputIsInteger: inputType === 'int',
				inputIsFloat64: inputType === 'float64',
				rows: [],
				defaultSet: false,
			},
		});

		return context;
	}
);

export default mapBegin;
