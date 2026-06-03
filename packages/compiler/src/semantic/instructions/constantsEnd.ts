import type { CompilationContext, ConstantsEndLine } from '@8f4e/compiler-spec';

import { popBlock } from '../../utils/blockStack';

export default function semanticConstantsEnd(_line: ConstantsEndLine, context: CompilationContext) {
	popBlock(context);
}
