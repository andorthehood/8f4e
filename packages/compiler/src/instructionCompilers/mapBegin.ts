import { BlockType } from '@8f4e/compiler-spec';

import { pushBlock } from '../utils/blockStack';

import type { InstructionCompiler, MapBeginLine } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `mapBegin`.
 * Opens a map block scope and records the input type for the mapping operation.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const mapBegin: InstructionCompiler<MapBeginLine> = (line: MapBeginLine, context) => {
	const inputType = line.arguments[0].value;

	pushBlock(context, {
		expectedResultIsInteger: false,
		hasExpectedResult: false,
		blockType: BlockType.MAP,
		mapState: {
			inputIsInteger: inputType === 'int',
			inputIsFloat64: inputType === 'float64',
			rows: [],
			defaultSet: false,
		},
	});

	return context;
};

export default mapBegin;
