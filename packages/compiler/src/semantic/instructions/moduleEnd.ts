import type { CompilationContext, ModuleEndLine } from '@8f4e/compiler-spec';

import { popBlock } from '../../utils/blockStack';

/** Closes the active module block after tokenizer placement has matched the block structure. */
export default function semanticModuleEnd(_line: ModuleEndLine, context: CompilationContext) {
	popBlock(context);
}
