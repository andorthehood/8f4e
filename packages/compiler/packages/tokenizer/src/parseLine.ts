import type { Argument, CompilerASTLine, MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { ArgumentType, isMemoryDeclarationLine } from '@8f4e/compiler-spec';
import isArrayDeclarationInstruction from './syntax/isArrayDeclarationInstruction';
import isMemoryDeclarationInstruction from './syntax/isMemoryDeclarationInstruction';
import { parseArgument } from './syntax/parseArgument';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';
import validateInstructionArguments from './syntax/validateInstructionArguments';

/** Determines whether a memory declaration includes a default value source argument. */
function hasExplicitMemoryDefault(instruction: string, args: Array<Argument>): boolean {
	if (isArrayDeclarationInstruction(instruction)) {
		return args.length > 2;
	}

	if (args.length === 0) {
		return false;
	}

	const firstArg = args[0];
	if (firstArg.type !== ArgumentType.IDENTIFIER) {
		return true;
	}
	if (firstArg.referenceKind === 'constant') {
		return true;
	}
	return args.length > 1;
}

/** Adds namespace references discovered from syntax-level arguments to a line accumulator. */
function addReferencedNamespaceIdsFromArgument(referencedNamespaceIds: Set<string>, argument: Argument): void {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		for (const moduleId of argument.intermoduleIds) {
			referencedNamespaceIds.add(moduleId);
		}
		return;
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return;
	}

	if (argument.scope === 'intermodule' && argument.targetModuleId) {
		referencedNamespaceIds.add(argument.targetModuleId);
	}
}

/**
 * Tokenizes an instruction line, treating quoted strings as single tokens.
 * Stops at an unquoted semicolon (comment delimiter).
 * Escape sequences inside quotes are preserved for parseArgument to decode.
 */
function tokenizeInstruction(line: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	const len = line.length;

	while (i < len) {
		if (/\s/.test(line[i])) {
			i++;
			continue;
		}

		if (line[i] === ';') break;

		if (line[i] === '"') {
			let token = '"';
			i++;
			while (i < len && line[i] !== '"') {
				if (line[i] === '\\' && i + 1 < len) {
					token += line[i] + line[i + 1];
					i += 2;
				} else {
					token += line[i++];
				}
			}
			if (i >= len) {
				throw new SyntaxRulesError(SyntaxErrorCode.INVALID_STRING_LITERAL, 'Unterminated string literal');
			}
			token += '"';
			i++;
			tokens.push(token);
		} else {
			let token = '';
			while (i < len && !/\s/.test(line[i]) && line[i] !== ';') {
				token += line[i++];
			}
			if (token) tokens.push(token);
		}
	}

	return tokens;
}

/** Recreates a syntax error with source line metadata from the parser context. */
function withSyntaxLine(error: SyntaxRulesError, lineNumber: number, instruction?: string): SyntaxRulesError {
	return new SyntaxRulesError(error.code, error.message, {
		lineNumber,
		instruction,
	});
}

/**
 * Tokenizes a physical line and attaches line metadata to tokenizer-level syntax errors.
 *
 * @param line - Source AST line being processed.
 * @param lineNumber - One-based source line number for diagnostics.
 * @returns Instruction tokens parsed from the physical source line.
 */
export function parseInstructionTokens(line: string, lineNumber: number): string[] {
	try {
		return tokenizeInstruction(line);
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw withSyntaxLine(error, lineNumber);
		}
		throw error;
	}
}

/**
 * Parses and syntax-validates one logical source line into an AST line.
 *
 * @param line - Source AST line being processed.
 * @param lineNumber - One-based source line number for diagnostics.
 * @returns Parsed compiler AST line.
 */
export function parseLine(line: string, lineNumber: number): CompilerASTLine {
	let instruction: string | undefined;
	try {
		const tokens = tokenizeInstruction(line);
		const [first = '', ...args] = tokens;
		instruction = first;
		const isMemoryDeclaration = isMemoryDeclarationInstruction(instruction);
		const shouldRecordNamespaceReferences = isMemoryDeclaration || instruction === 'const' || instruction === 'use';
		const parsedArguments: Argument[] = [];
		const referencedNamespaceIds = new Set<string>();
		for (const arg of args) {
			const parsedArgument = parseArgument(arg);
			parsedArguments.push(parsedArgument);
			if (shouldRecordNamespaceReferences) {
				addReferencedNamespaceIdsFromArgument(referencedNamespaceIds, parsedArgument);
			}
		}
		validateInstructionArguments(instruction, parsedArguments);
		const [useArgument] = parsedArguments;
		if (shouldRecordNamespaceReferences && instruction === 'use' && useArgument?.type === ArgumentType.IDENTIFIER) {
			referencedNamespaceIds.add(useArgument.value);
		}
		const parsedLine = {
			lineNumber,
			instruction,
			arguments: parsedArguments,
			...(referencedNamespaceIds.size > 0 ? { referencedNamespaceIds: [...referencedNamespaceIds] } : {}),
		} as CompilerASTLine;

		if (isMemoryDeclarationLine(parsedLine)) {
			const memoryLine: MemoryDeclarationLine = parsedLine;
			memoryLine.hasExplicitMemoryDefault = hasExplicitMemoryDefault(instruction, parsedArguments);
		}

		return parsedLine;
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			throw withSyntaxLine(
				error,
				lineNumber,
				// instruction is undefined only if tokenizeInstruction threw before assignment
				instruction ?? undefined
			);
		}
		throw error;
	}
}
