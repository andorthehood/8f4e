import type { CodeBlockType } from '@8f4e/editor-state-types';
import highlightSyntax8f4e from './highlightSyntax8f4e';
import highlightSyntaxGlsl from './highlightSyntaxGlsl';
import highlightSyntaxNote from './highlightSyntaxNote';
import type { SyntaxFonts, SyntaxHighlighting } from './types';

function isShaderNote(code: string[]): boolean {
	return /^(?:note\s+)(?:vertexShader|fragmentShader)(?:Postprocess|Background)\b/.test(code[0]?.trim() ?? '');
}

export default function highlightSyntax<T>(
	code: string[],
	blockType: CodeBlockType,
	fonts: SyntaxFonts<T>
): SyntaxHighlighting<T> {
	if (blockType !== 'note') return highlightSyntax8f4e(code, fonts);
	return isShaderNote(code) ? highlightSyntaxGlsl(code, fonts) : highlightSyntaxNote(code, fonts);
}
