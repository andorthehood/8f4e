import type { Project } from '@8f4e/editor-state';

const project: Project = {
	title: 'CRT Effect Demo',
	author: 'Andor Polgar',
	description:
		'Demonstrates post-process shader effects with a classic CRT monitor appearance including barrel distortion, scanlines, and flicker.',
	codeBlocks: [
		{
			code: [
				'module main',
				'',
				'; This project demonstrates the CRT',
				'; post-process effect configured via',
				'; project.json postProcessEffects.',
				'',
				'; The effect includes:',
				'; - Barrel distortion',
				'; - Scanline overlay',
				'; - Subtle flicker animation',
				'',
				'; Press F1 to toggle the effect on/off',
				'; to see the difference.',
				'',
				'moduleEnd',
			],
			x: 10,
			y: 10,
			isOpen: true,
		},
		{
			code: [
				'module counter',
				'',
				'int count',
				'debug count',
				'',
				'push &count',
				'load',
				'push 1',
				'add',
				'dup',
				'push &count',
				'store',
				'',
				'push 100',
				'remainder',
				'push 0',
				'equal',
				'if',
				'  ; Reset counter every 100',
				'  push 0',
				'  push &count',
				'  store',
				'ifEnd',
				'',
				'moduleEnd',
			],
			x: 50,
			y: 10,
			isOpen: true,
		},
	],
	viewport: {
		x: 0,
		y: 0,
	},
	selectedRuntime: 0,
	runtimeSettings: [
		{
			runtime: 'WebWorkerLogicRuntime',
			sampleRate: 50,
		},
	],
	binaryAssets: [],
	postProcessEffects: [
		{
			name: 'crt',
			vertexShader: `
precision mediump float;

attribute vec2 a_position;

varying vec2 v_screenCoord;

void main() {
	gl_Position = vec4(a_position, 0, 1);
	v_screenCoord = (a_position + 1.0) / 2.0;
}
`,
			fragmentShader: `
precision mediump float;

#define DISTORTION_INTENSITY 0.125
#define SCANLINE_FREQUENCY 50.0
#define SCANLINE_POWER 0.1
#define FLICKER_SPEED 50.0
#define FLICKER_INTENSITY 0.05
#define FLICKER_BASE 0.9

varying vec2 v_screenCoord;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_renderTexture;

void main() {
	vec2 uv = v_screenCoord;
	
	// Apply barrel distortion to UV coordinates
	vec2 center = vec2(0.5, 0.5);
	vec2 offset = uv - center;
	float dist = length(offset);
	vec2 distortedUV = center + offset * (1.0 + DISTORTION_INTENSITY * dist);
	
	// Sample the rendered sprite content with distortion
	vec3 color = texture2D(u_renderTexture, distortedUV).rgb;
	
	// Create scanline effect
	float scanline = sin(uv.y * u_resolution.y * SCANLINE_FREQUENCY) * 0.5 + 0.5;
	scanline = pow(scanline, SCANLINE_POWER);
	
	// Add some flicker based on time
	float flicker = sin(u_time * FLICKER_SPEED) * FLICKER_INTENSITY + FLICKER_BASE;
	
	// Apply scanline and flicker effects to the sprite content
	color *= scanline * flicker;
	
	gl_FragColor = vec4(color, 1.0);
}
`,
			enabled: true,
		},
	],
	compiledModules: {},
};

export default project;
