import type { CompilationContext, CompilerASTLine, Stack } from '@8f4e/compiler-spec';

export type InstructionAnalysisResult = {
	consumed: Stack;
	produced: Stack;
	dropped?: Stack;
};

export type InstructionAnalyzer<TLine extends CompilerASTLine = CompilerASTLine> = (
	line: TLine,
	context: CompilationContext
) => InstructionAnalysisResult;
