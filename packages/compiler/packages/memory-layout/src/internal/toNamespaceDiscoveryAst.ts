import { ArgumentType, type AST } from '@8f4e/tokenizer';

export function toNamespaceDiscoveryAst(ast: AST): AST {
	return ast.flatMap(line => {
		if (line.instruction === 'init') {
			return [];
		}

		if (
			line.isMemoryDeclaration &&
			!line.instruction.endsWith('[]') &&
			line.arguments[0]?.type === ArgumentType.IDENTIFIER
		) {
			return [
				{
					...line,
					arguments: [line.arguments[0]],
				},
			];
		}

		return [line];
	});
}
