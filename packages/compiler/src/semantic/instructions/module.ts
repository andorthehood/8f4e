import {
	BLOCK_TYPE,
	compilerSourceBlockInstructionByType,
	type CompilationContext,
	type ModuleLine,
} from '@8f4e/compiler-spec';

const moduleBlockType = compilerSourceBlockInstructionByType.module.type;

export default function semanticModule(line: ModuleLine, context: CompilationContext) {
	const moduleId = line.arguments[0].value;

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});

	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = moduleBlockType;
}
