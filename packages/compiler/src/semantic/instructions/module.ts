import {
	BlockType,
	type CompilationContext,
	compilerSourceBlockInstructionByType,
	type ModuleLine,
} from '@8f4e/compiler-spec';

import { pushBlock } from '../../utils/blockStack';

const moduleBlockType = compilerSourceBlockInstructionByType.module.type;

/**
 * Applies the `module` semantic instruction to initialize the active namespace context.
 *
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 */
export default function semanticModule(line: ModuleLine, context: CompilationContext) {
	const moduleId = line.arguments[0].value;

	pushBlock(context, { expectedResultTypes: [], blockType: BlockType.MODULE });

	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = moduleBlockType;
}
