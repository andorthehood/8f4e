import { BLOCK_TYPE } from '../types';

import type { CompilationContext } from '../types';

export default function createInstructionCompilerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	const base: CompilationContext = {
		namespace: {
			namespaces: {},
			memory: {},
			locals: {},
			consts: {},
			moduleName: 'test',
		},
		stack: [],
		blockStack: [
			{
				blockType: BLOCK_TYPE.MODULE,
				expectedResultIsInteger: false,
				hasExpectedResult: false,
			},
		],
		startingByteAddress: 0,
		memoryByteSize: 0,
		initSegmentByteCode: [],
		loopSegmentByteCode: [],
	};

	return {
		...base,
		...overrides,
		namespace: {
			...base.namespace,
			...overrides.namespace,
		},
	};
}
