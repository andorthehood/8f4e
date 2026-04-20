export type CompileErrorStage = 'compiler' | 'symbols' | 'memory-layout';

export interface CompileErrorLine {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction?: string;
	arguments?: unknown[];
}

export interface CompileErrorContext {
	codeBlockId?: string;
	codeBlockType?: 'module' | 'function' | 'constants';
}

export interface CompileError {
	stage: CompileErrorStage;
	code: number | string;
	message: string;
	line: CompileErrorLine;
	context?: CompileErrorContext;
}
