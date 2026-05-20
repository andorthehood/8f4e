import { BlockType } from '@8f4e/compiler-spec';

import { createCompilationContext } from '../semantic/createCompilationContext';

import type { CompilationContext } from '@8f4e/compiler-spec';

export default function createInstructionCompilerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	return createCompilationContext({
		...overrides,
		namespace: {
			moduleName: 'test',
			...overrides.namespace,
		},
		blockStack: overrides.blockStack ?? [
			{
				blockType: BlockType.MODULE,
				expectedResultIsInteger: false,
				hasExpectedResult: false,
			},
		],
		codeBlockId: overrides.codeBlockId ?? 'test',
		codeBlockType: overrides.codeBlockType ?? 'module',
	});
}
