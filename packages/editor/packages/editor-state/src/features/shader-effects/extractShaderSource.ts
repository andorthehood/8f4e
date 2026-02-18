/**
 * Extracts shader source code from between shader markers.
 * The start marker can include a target suffix (e.g. 'fragmentShader postprocess').
 * The end marker is derived from the base type (e.g. 'fragmentShaderEnd').
 *
 * Editor directives (lines matching `; @<word>` pattern) are replaced with blank lines
 * to prevent GLSL syntax errors while preserving line numbers for accurate error reporting.
 */
export default function extractShaderSource(code: string[], startMarker: string): string {
	const baseType = startMarker.split(/\s+/)[0];
	const endMarker = baseType + 'End';

	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i++) {
		const trimmedLine = code[i].trim();
		if (trimmedLine === startMarker) {
			startIndex = i;
		} else if (trimmedLine === endMarker) {
			endIndex = i;
			break;
		}
	}

	if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
		return '';
	}

	// Extract lines between markers (excluding the markers themselves)
	const sourceLines = code.slice(startIndex + 1, endIndex);

	// Replace editor directives with blank lines to preserve line numbers for error reporting.
	// Directives match pattern: "; @<word>" (e.g. "; @pos", "; @disabled")
	const processedLines = sourceLines.map(line => {
		if (/^\s*;\s*@\w+/.test(line)) {
			return '';
		}
		return line;
	});

	// GLSL requires #version to be on line 1.
	// If directives were above it and got blanked out, move #version to first line while
	// preserving downstream line indices by keeping total line count unchanged.
	const versionLineIndex = processedLines.findIndex(line => /^\s*#version\b/.test(line));
	if (versionLineIndex > 0) {
		const [versionLine] = processedLines.splice(versionLineIndex, 1);
		processedLines.unshift(versionLine);
	}

	return processedLines.join('\n');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractShaderSource', () => {
		it('extracts vertex shader source between markers', () => {
			const code = [
				'vertexShader postprocess',
				'attribute vec2 a_position;',
				'void main() {',
				'  gl_Position = vec4(a_position, 0, 1);',
				'}',
				'vertexShaderEnd',
			];

			const source = extractShaderSource(code, 'vertexShader postprocess');
			expect(source).toBe('attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0, 1);\n}');
		});

		it('extracts fragment shader source between markers', () => {
			const code = [
				'fragmentShader background',
				'precision mediump float;',
				'void main() {',
				'  gl_FragColor = vec4(1.0);',
				'}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader background');
			expect(source).toBe('precision mediump float;\nvoid main() {\n  gl_FragColor = vec4(1.0);\n}');
		});

		it('returns empty string when markers are missing', () => {
			const code = ['some code', 'more code'];
			expect(extractShaderSource(code, 'vertexShader postprocess')).toBe('');
		});

		it('replaces editor directive lines with blank lines', () => {
			const code = [
				'fragmentShader background',
				'; @pos 10 20',
				'precision mediump float;',
				'; @disabled',
				'void main() {',
				'  gl_FragColor = vec4(1.0);',
				'}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader background');
			expect(source).toBe('\nprecision mediump float;\n\nvoid main() {\n  gl_FragColor = vec4(1.0);\n}');
		});

		it('preserves line count when directives are present', () => {
			const code = [
				'fragmentShader background',
				'; @pos 87 10',
				'#version 300 es',
				'',
				'precision mediump float;',
				'void main() {}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader background');
			// Lines between markers (indices 1-5, exclusive of markers at 0 and 6)
			const extractedLines = code.slice(1, 6);
			const outputLines = source.split('\n');

			expect(outputLines.length).toBe(extractedLines.length);
		});

		it('moves #version to first line when directives appear above it', () => {
			const code = [
				'fragmentShader background',
				'; @pos 87 10',
				'#version 300 es',
				'precision mediump float;',
				'void main() {}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader background');
			const lines = source.split('\n');
			expect(lines[0]).toBe('#version 300 es');
			expect(lines[1]).toBe('');
			expect(lines[2]).toBe('precision mediump float;');
		});

		it('replaces various directive formats with blank lines', () => {
			const code = [
				'vertexShader postprocess',
				';@pos 0 0',
				'  ; @disabled',
				'\t;\t@favorite',
				'; @group myGroup',
				'attribute vec2 a_position;',
				'vertexShaderEnd',
			];

			const source = extractShaderSource(code, 'vertexShader postprocess');
			const lines = source.split('\n');

			expect(lines[0]).toBe('');
			expect(lines[1]).toBe('');
			expect(lines[2]).toBe('');
			expect(lines[3]).toBe('');
			expect(lines[4]).toBe('attribute vec2 a_position;');
		});

		it('does not affect non-directive comment lines', () => {
			const code = [
				'fragmentShader background',
				'; This is a regular comment',
				'; Another comment without directive',
				'precision mediump float;',
				'; @ not a valid directive (space before @)',
				'void main() {}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader background');
			expect(source).toBe(
				'; This is a regular comment\n; Another comment without directive\nprecision mediump float;\n; @ not a valid directive (space before @)\nvoid main() {}'
			);
		});

		it('handles empty shader with only directives', () => {
			const code = ['fragmentShader background', '; @pos 10 20', '; @disabled', 'fragmentShaderEnd'];

			const source = extractShaderSource(code, 'fragmentShader background');
			expect(source).toBe('\n');
		});

		it('handles shader with directive at different positions', () => {
			const code = [
				'fragmentShader background',
				'precision mediump float;',
				'; @pos 10 20',
				'void main() {',
				'; @debug enabled',
				'  gl_FragColor = vec4(1.0);',
				'}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader background');
			expect(source).toBe('precision mediump float;\n\nvoid main() {\n\n  gl_FragColor = vec4(1.0);\n}');
		});
	});
}
