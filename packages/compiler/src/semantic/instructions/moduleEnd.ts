import type { CompilationContext, ModuleEndLine } from '@8f4e/compiler-spec';

import { popBlock } from '../../utils/blockStack';

export default function semanticModuleEnd(_line: ModuleEndLine, context: CompilationContext) {
	popBlock(context);
}
