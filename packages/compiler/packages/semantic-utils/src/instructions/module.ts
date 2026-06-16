import {
	BlockType,
	type CompilationContext,
	compilerSourceBlockInstructionByType,
	type ModuleLine,
} from '@8f4e/language-spec';

import { pushBlock } from '../blockStack';

const moduleBlockType = compilerSourceBlockInstructionByType.module.type;

/**
 * Applies the `module` semantic instruction to initialize the active namespace context.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export default function semanticModule(line: ModuleLine, context: CompilationContext) {
	const moduleId = line.arguments[0].value;

	pushBlock(context, { expectedResultTypes: [], blockType: BlockType.MODULE });

	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = moduleBlockType;
}
