import type { CompilerDiagnostic } from '@8f4e/language-spec';

export interface ResolveIncludeRequestMessage {
	type: 'resolveInclude';
	compilationId: number;
	payload: {
		requestId: number;
		includeId: string;
	};
}

export interface ResolveIncludeSuccessMessage {
	type: 'resolveIncludeResult';
	compilationId: number;
	payload: {
		requestId: number;
		source: string | undefined;
	};
}

export interface ResolveIncludeErrorMessage {
	type: 'resolveIncludeResult';
	compilationId: number;
	payload: {
		requestId: number;
		error: CompilerDiagnostic;
	};
}

export type ResolveIncludeResultMessage = ResolveIncludeSuccessMessage | ResolveIncludeErrorMessage;
