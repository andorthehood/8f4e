import { ArgumentType, type AST, type CompilationContext, type Const } from '../../types';

export default function semanticConst(line: AST[number], context: CompilationContext) {
	const constName = (line.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string }).value;
	const constValue = line.arguments[1] as Const;
	context.namespace.consts[constName] = constValue;
}
