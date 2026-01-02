/**
 * Extracts shader source code from between shader markers.
 * For vertexShader blocks: extracts lines between 'vertexShader <id>' and 'vertexShaderEnd'
 * For fragmentShader blocks: extracts lines between 'fragmentShader <id>' and 'fragmentShaderEnd'
 */
export default function extractShaderSource(code: string[], blockType: 'vertexShader' | 'fragmentShader'): string {
	const startMarker = blockType;
	const endMarker = blockType + 'End';

	let startIndex = -1;
	let endIndex = -1;

	for (let i = 0; i < code.length; i++) {
		const trimmedLine = code[i].trim();
		// Check if line starts with the marker followed by a space and ID
		// We require an ID to be present, so "vertexShader" alone won't match
		if (trimmedLine.startsWith(startMarker + ' ')) {
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
	return sourceLines.join('\n');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractShaderSource', () => {
		it('extracts vertex shader source between markers', () => {
			const code = [
				'vertexShader test',
				'attribute vec2 a_position;',
				'void main() {',
				'  gl_Position = vec4(a_position, 0, 1);',
				'}',
				'vertexShaderEnd',
			];

			const source = extractShaderSource(code, 'vertexShader');
			expect(source).toBe('attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0, 1);\n}');
		});

		it('extracts fragment shader source between markers', () => {
			const code = [
				'fragmentShader test',
				'precision mediump float;',
				'void main() {',
				'  gl_FragColor = vec4(1.0);',
				'}',
				'fragmentShaderEnd',
			];

			const source = extractShaderSource(code, 'fragmentShader');
			expect(source).toBe('precision mediump float;\nvoid main() {\n  gl_FragColor = vec4(1.0);\n}');
		});

		it('returns empty string when markers are missing', () => {
			const code = ['some code', 'more code'];
			expect(extractShaderSource(code, 'vertexShader')).toBe('');
		});
	});
}
