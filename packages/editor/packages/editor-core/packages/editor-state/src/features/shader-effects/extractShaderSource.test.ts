import { describe, expect, it } from 'vitest';
import extractShaderSource from './extractShaderSource';

describe('extractShaderSource', () => {
	it('extracts vertex shader source between markers', () => {
		const code = [
			'note vertexShaderPostprocess',
			'attribute vec2 a_position;',
			'void main() {',
			'  gl_Position = vec4(a_position, 0, 1);',
			'}',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		expect(source).toBe('attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0, 1);\n}');
	});

	it('extracts fragment shader source between markers', () => {
		const code = [
			'note fragmentShaderBackground',
			'precision mediump float;',
			'void main() {',
			'  gl_FragColor = vec4(1.0);',
			'}',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		expect(source).toBe('precision mediump float;\nvoid main() {\n  gl_FragColor = vec4(1.0);\n}');
	});

	it('returns empty string when markers are missing', () => {
		expect(extractShaderSource(['some code', 'more code'])).toBe('');
	});

	it('replaces editor directive lines with blank lines', () => {
		const code = [
			'note fragmentShaderBackground',
			'; @pos 10 20',
			'precision mediump float;',
			'; @disabled',
			'void main() {',
			'  gl_FragColor = vec4(1.0);',
			'}',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		expect(source).toBe('\nprecision mediump float;\n\nvoid main() {\n  gl_FragColor = vec4(1.0);\n}');
	});

	it('preserves line count when directives are present', () => {
		const code = [
			'note fragmentShaderBackground',
			'; @pos 87 10',
			'#version 300 es',
			'',
			'precision mediump float;',
			'void main() {}',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		expect(source.split('\n').length).toBe(code.slice(1, 6).length);
	});

	it('moves #version to first line when directives appear above it', () => {
		const code = [
			'note fragmentShaderBackground',
			'; @pos 87 10',
			'#version 300 es',
			'precision mediump float;',
			'void main() {}',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		const lines = source.split('\n');
		expect(lines[0]).toBe('#version 300 es');
		expect(lines[1]).toBe('');
		expect(lines[2]).toBe('precision mediump float;');
	});

	it('replaces various directive formats with blank lines', () => {
		const code = [
			'note vertexShaderPostprocess',
			';@pos 0 0',
			'  ; @disabled',
			'\t;\t@favorite',
			'; @group myGroup',
			'attribute vec2 a_position;',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		const lines = source.split('\n');

		expect(lines[0]).toBe('');
		expect(lines[1]).toBe('');
		expect(lines[2]).toBe('');
		expect(lines[3]).toBe('');
		expect(lines[4]).toBe('attribute vec2 a_position;');
	});

	it('does not affect non-directive comment lines', () => {
		const code = [
			'note fragmentShaderBackground',
			'; This is a regular comment',
			'; Another comment without directive',
			'precision mediump float;',
			'; @ not a valid directive (space before @)',
			'void main() {}',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		expect(source).toBe(
			'; This is a regular comment\n; Another comment without directive\nprecision mediump float;\n; @ not a valid directive (space before @)\nvoid main() {}'
		);
	});

	it('handles empty shader with only directives', () => {
		const source = extractShaderSource(['note fragmentShaderBackground', '; @pos 10 20', '; @disabled', 'noteEnd']);
		expect(source).toBe('\n');
	});

	it('handles shader with directive at different positions', () => {
		const code = [
			'note fragmentShaderBackground',
			'precision mediump float;',
			'; @pos 10 20',
			'void main() {',
			'; @watch enabled',
			'  gl_FragColor = vec4(1.0);',
			'}',
			'noteEnd',
		];

		const source = extractShaderSource(code);
		expect(source).toBe('precision mediump float;\n\nvoid main() {\n\n  gl_FragColor = vec4(1.0);\n}');
	});
});
