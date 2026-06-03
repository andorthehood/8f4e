import type { CompilationContext, ConstantsEndLine } from '@8f4e/compiler-spec';

import { popBlock } from '../../utils/blockStack';

/** Closes the active constants block after tokenizer placement has matched the block structure. */
export default function semanticConstantsEnd(_line: ConstantsEndLine, context: CompilationContext) {
	popBlock(context);
}
