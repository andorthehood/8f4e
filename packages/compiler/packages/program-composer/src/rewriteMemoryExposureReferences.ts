import type { Argument, ArgumentIdentifier, CompilerASTLine, ValidatedAST } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import type { ComposedProjectMemoryExposure } from './types';

function rewriteIdentifier(
	argument: ArgumentIdentifier,
	exposuresByReference: ReadonlyMap<string, ComposedProjectMemoryExposure>
): ArgumentIdentifier {
	if (argument.scope !== 'intermodule' || !('targetMemoryId' in argument)) {
		return argument;
	}

	const reference = `${argument.targetModuleId}:${argument.targetMemoryId}`;
	const exposure = exposuresByReference.get(reference);
	if (!exposure) {
		return argument;
	}

	return {
		...argument,
		value: argument.value.replace(reference, `${exposure.targetModuleId}:${exposure.targetMemoryName}`),
		targetModuleId: exposure.targetModuleId,
		targetMemoryId: exposure.targetMemoryName,
	} as ArgumentIdentifier;
}

function rewriteArgument(
	argument: Argument,
	exposuresByReference: ReadonlyMap<string, ComposedProjectMemoryExposure>
): Argument {
	if (argument.type === ArgumentType.IDENTIFIER) {
		return rewriteIdentifier(argument, exposuresByReference);
	}
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const left =
			argument.left.type === ArgumentType.IDENTIFIER
				? rewriteIdentifier(argument.left, exposuresByReference)
				: argument.left;
		const right =
			argument.right.type === ArgumentType.IDENTIFIER
				? rewriteIdentifier(argument.right, exposuresByReference)
				: argument.right;
		return left === argument.left && right === argument.right ? argument : { ...argument, left, right };
	}
	return argument;
}

function rewriteLine(
	line: CompilerASTLine,
	exposuresByReference: ReadonlyMap<string, ComposedProjectMemoryExposure>
): CompilerASTLine {
	const args = line.arguments.map(argument => rewriteArgument(argument, exposuresByReference));
	return args.every((argument, index) => argument === line.arguments[index])
		? line
		: ({ ...line, arguments: args } as CompilerASTLine);
}

function rewriteAst<TAst extends ValidatedAST>(
	ast: TAst,
	exposuresByReference: ReadonlyMap<string, ComposedProjectMemoryExposure>
): TAst {
	const rewrittenLineByOriginal = new Map<CompilerASTLine, CompilerASTLine>();
	const lines = ast.lines.map(line => {
		const rewrittenLine = rewriteLine(line, exposuresByReference);
		rewrittenLineByOriginal.set(line, rewrittenLine);
		return rewrittenLine;
	});
	if (lines.every((line, index) => line === ast.lines[index])) {
		return ast;
	}
	const getRewrittenLine = <TLine extends CompilerASTLine>(line: TLine): TLine =>
		rewrittenLineByOriginal.get(line) as TLine;

	switch (ast.type) {
		case 'module':
			return { ...ast, lines, moduleLine: getRewrittenLine(ast.moduleLine) } as TAst;
		case 'constants':
			return { ...ast, lines, constantsLine: getRewrittenLine(ast.constantsLine) } as TAst;
		case 'prototype':
			return { ...ast, lines, prototypeLine: getRewrittenLine(ast.prototypeLine) } as TAst;
		case 'function':
			return {
				...ast,
				lines,
				functionLine: getRewrittenLine(ast.functionLine),
				functionEndLine: getRewrittenLine(ast.functionEndLine),
				...(ast.exportLine ? { exportLine: getRewrittenLine(ast.exportLine) } : {}),
				...(ast.importLine ? { importLine: getRewrittenLine(ast.importLine) } : {}),
			} as TAst;
	}
}

/** Replaces public group exposure references with their canonical backing module memory references. */
export function rewriteMemoryExposureReferences<TAst extends ValidatedAST>(
	asts: TAst[],
	exposures: readonly ComposedProjectMemoryExposure[]
): TAst[] {
	if (exposures.length === 0) {
		return asts;
	}
	const exposuresByReference = new Map(exposures.map(exposure => [`${exposure.groupPath}:${exposure.name}`, exposure]));
	return asts.map(ast => rewriteAst(ast, exposuresByReference));
}
