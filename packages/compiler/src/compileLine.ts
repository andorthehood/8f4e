import type {
	AnalyzedLine,
	CompilationContext,
	CompiledStackAnalysisLine,
	CompilerASTLine,
	InstructionCompiler,
} from '@8f4e/compiler-spec';
import { isSemanticInstructionLine } from '@8f4e/compiler-spec';
import type { Instruction } from './instructionCompilers';
import instructions from './instructionCompilers';
import { applySemanticLine } from './semantic/buildNamespace';
import { analyzeInstruction } from './stackAnalysis/analyzeInstruction';

export function compileCodegenLine(line: AnalyzedLine, context: CompilationContext) {
	const instruction = line.instruction as Instruction;
	const compileInstruction = instructions[instruction] as InstructionCompiler;
	compileInstruction(line, context);
}

export function toCompiledStackAnalysisLine(line: AnalyzedLine): CompiledStackAnalysisLine {
	return {
		lineNumber: line.lineNumber,
		instruction: line.instruction,
		stackAnalysis: line.stackAnalysis,
	};
}

export function compileLine(line: CompilerASTLine, context: CompilationContext): AnalyzedLine | undefined {
	if (isSemanticInstructionLine(line)) {
		applySemanticLine(line, context);
		return;
	}

	const analyzedLine = analyzeInstruction(line, context);
	compileCodegenLine(analyzedLine, context);
	return analyzedLine;
}
