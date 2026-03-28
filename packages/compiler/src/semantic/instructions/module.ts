import { ArgumentType, BLOCK_TYPE, type AST, type CompilationContext } from '../../types';

export default function semanticModule(line: AST[number], context: CompilationContext) {
	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});

	const moduleId = (line.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string }).value;
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = 'module';
}
