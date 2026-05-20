import { BlockType } from '@8f4e/compiler-spec';

import { createCompilationContext } from '../semantic/createCompilationContext';
import { analyzeInstruction } from '../stackAnalysis/analyzeInstruction';

import type { AST, AnalyzedLine, CompilationContext, InstructionCompiler } from '@8f4e/compiler-spec';

export default function createInstructionCompilerTestContext(
	overrides: Partial<CompilationContext> = {}
): CompilationContext {
	return createCompilationContext({
		...overrides,
		namespace: {
			moduleName: 'test',
			...overrides.namespace,
		},
		blockStack: overrides.blockStack ?? [
			{
				blockType: BlockType.MODULE,
				expectedResultIsInteger: false,
				hasExpectedResult: false,
			},
		],
		codeBlockId: overrides.codeBlockId ?? 'test',
		codeBlockType: overrides.codeBlockType ?? 'module',
	});
}

export function analyzeAndCompileInstruction<TLine extends AST[number]>(
	compileInstruction: InstructionCompiler<TLine>,
	line: TLine,
	context: CompilationContext
): CompilationContext {
	compileInstruction(analyzeInstruction(line, context) as AnalyzedLine<TLine>, context);
	return context;
}
