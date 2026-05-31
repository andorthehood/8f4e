import { describe, expect, it } from 'vitest';
import highlightSyntaxGlsl from './highlightSyntaxGlsl';

const spriteLookups = {
	fontLineNumber: 'line',
	fontInstruction: 'instruction',
	fontCode: 'code',
	fontCodeComment: 'comment',
	fontNumbers: 'number',
	fontBinaryZero: 'zero',
	fontBinaryOne: 'one',
	fontBasePrefix: 'prefix',
} as const;

describe('highlightSyntaxGlsl', () => {
	it('highlights GLSL shader code with keywords, types, comments, numbers, and preprocessor directives', () => {
		const glslCode = [
			'#version 300 es',
			'precision mediump float;',
			'',
			'#define PI 3.14159',
			'#define ITERATIONS 10',
			'',
			'// Varyings and uniforms',
			'varying vec2 v_texCoord;',
			'uniform sampler2D u_texture;',
			'uniform float u_time;',
			'uniform vec3 u_color;',
			'',
			'/* Helper function',
			'   for color blending */',
			'vec4 blend(vec4 a, vec4 b) {',
			'  float factor = 0.5;',
			'  int mask = 0xff;',
			'  if (factor > 0.0) {',
			'    return a * factor;',
			'  } else {',
			'    return b;',
			'  }',
			'}',
			'',
			'void main() {',
			'  vec2 uv = v_texCoord;',
			'  float dist = length(uv);',
			'  ',
			'  for (int i = 0; i < ITERATIONS; i++) {',
			'    dist += 0.1;',
			'  }',
			'  ',
			'  while (dist > 1.0) {',
			'    dist -= 0.5;',
			'    break;',
			'  }',
			'  ',
			'  vec4 color = texture2D(u_texture, uv);',
			'  gl_FragColor = blend(color, vec4(u_color, 1.0));',
			'}',
		];

		const result = highlightSyntaxGlsl(glslCode, spriteLookups);
		expect(result).toMatchSnapshot();
	});
});
