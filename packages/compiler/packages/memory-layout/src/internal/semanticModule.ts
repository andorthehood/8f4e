import { BLOCK_TYPE, type PublicMemoryLayoutContext } from '../types';

import type { ModuleLine } from '@8f4e/tokenizer';

export function semanticModule(line: ModuleLine, context: PublicMemoryLayoutContext) {
	const moduleId = line.arguments[0].value;
	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = 'module';
}
