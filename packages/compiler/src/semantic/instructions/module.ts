import { ArgumentType, BLOCK_TYPE, type AST, type CompilationContext } from '../../types';

export default function semanticModule(line: AST[number], context: CompilationContext) {
	const moduleId = (line.arguments[0] as Extract<(typeof line.arguments)[number], { type: ArgumentType.IDENTIFIER }>)
		.value;

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});

	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = 'module';
}
