import {
	BlockType,
	compilerSourceBlockInstructionByType,
	type CompilationContext,
	type ModuleLine,
} from '@8f4e/compiler-spec';

import { pushBlock } from '../../utils/blockStack';

const moduleBlockType = compilerSourceBlockInstructionByType.module.type;

export default function semanticModule(line: ModuleLine, context: CompilationContext) {
	const moduleId = line.arguments[0].value;

	pushBlock(context, {
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BlockType.MODULE,
	});

	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = moduleBlockType;
}
