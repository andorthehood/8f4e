import { BlockType, type CompilationContext, ErrorCode, type ModuleEndLine } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';
import { popBlock } from '../../utils/blockStack';

export default function semanticModuleEnd(line: ModuleEndLine, context: CompilationContext) {
	const block = popBlock(context);

	if (!block || block.blockType !== BlockType.MODULE) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
