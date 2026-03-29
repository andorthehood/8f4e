import { BLOCK_TYPE, type CompilationContext, type ModuleLine } from '../../types';

export default function semanticModule(line: ModuleLine, context: CompilationContext) {
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
