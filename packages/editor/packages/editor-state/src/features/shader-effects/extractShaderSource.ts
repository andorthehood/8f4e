/**
 * Extracts shader source code from between note markers.
 *
 * Editor directives (lines matching `; @<word>` pattern) are replaced with blank lines
 * to prevent GLSL syntax errors while preserving line numbers for accurate error reporting.
 */
export default function extractShaderSource(code: string[]): string {
	const startIndex = code.findIndex(line => line.trim().startsWith('note'));
	const endIndex = code.findIndex((line, index) => index > startIndex && line.trim() === 'noteEnd');

	if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
		return '';
	}

	const sourceLines = code.slice(startIndex + 1, endIndex);
	const processedLines = sourceLines.map(line => {
		if (/^\s*;\s*@\w+/.test(line)) {
			return '';
		}
		return line;
	});

	const versionLineIndex = processedLines.findIndex(line => /^\s*#version\b/.test(line));
	if (versionLineIndex > 0) {
		const [versionLine] = processedLines.splice(versionLineIndex, 1);
		processedLines.unshift(versionLine);
	}

	return processedLines.join('\n');
}
