import {
	BlockType,
	type CompilationContext,
	type ConstantsLine,
	compilerSourceBlockInstructionByType,
} from '@8f4e/compiler-spec';

import { pushBlock } from '../../utils/blockStack';

const constantsBlockType = compilerSourceBlockInstructionByType.constants.type;

/**
 * Opens a constants namespace block after tokenizer placement has accepted its position.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export default function semanticConstants(line: ConstantsLine, context: CompilationContext) {
	pushBlock(context, { expectedResultTypes: [], blockType: BlockType.CONSTANTS });

	const moduleId = line.arguments[0].value;
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = constantsBlockType;
}
