import {
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
	type ArgumentIdentifier,
	type ArgumentLiteral,
	type ArgumentStringLiteral,
} from './syntax/parseArgument';

export {
	ArgumentType,
	type Argument,
	type ArgumentCompileTimeExpression,
	type ArgumentIdentifier,
	type ArgumentLiteral,
	type ArgumentStringLiteral,
};

export interface ASTLine {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction: string;
	arguments: Array<Argument>;
	isSemanticOnly?: boolean;
}

export type AST = ASTLine[];

export type ParsedLineMetadata = Array<{ callSiteLineNumber: number; macroId?: string }>;
