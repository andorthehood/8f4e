import { test, expect } from 'vitest';
import { page } from '@vitest/browser/context';

/**
 * Vitest-based visual regression test prototype
 *
 * This demonstrates using Vitest browser mode with Playwright provider
 * as a replacement for standalone Playwright screenshot tests.
 *
 * Benefits over Playwright-only approach:
 * - Unified testing stack (same runner for unit + visual tests)
 * - Shared test utilities and fixtures
 * - Consistent configuration and tooling
 * - Single CI pipeline for all test types
 *
 * Usage:
 *   npm run visual-test         # Run visual tests locally
 *   nx visual-test @8f4e/web-ui # Run via Nx
 */

test('should render a simple colored canvas', async () => {
	// Create a canvas element
	const canvas = document.createElement('canvas');
	canvas.width = 400;
	canvas.height = 300;
	canvas.style.border = '1px solid black';
	canvas.id = 'test-canvas';
	document.body.appendChild(canvas);

	// Get 2D context and draw a simple shape
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('2D context not supported');
	}

	// Draw a blue rectangle
	ctx.fillStyle = '#4A90E2';
	ctx.fillRect(50, 50, 300, 200);

	// Draw a yellow circle
	ctx.fillStyle = '#F5A623';
	ctx.beginPath();
	ctx.arc(200, 150, 50, 0, 2 * Math.PI);
	ctx.fill();

	// Add text
	ctx.fillStyle = '#FFFFFF';
	ctx.font = 'bold 24px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('Vitest Visual Test', 200, 150);

	// Take a screenshot using Vitest browser mode API
	// Note: Screenshots are saved to vitest-visual-tests/__screenshots__/
	await expect(page.screenshot()).resolves.toMatchSnapshot('simple-colored-canvas.png');

	// Cleanup
	document.body.removeChild(canvas);
});

test('should render a gradient', async () => {
	const canvas = document.createElement('canvas');
	canvas.width = 600;
	canvas.height = 400;
	canvas.id = 'gradient-canvas';
	document.body.appendChild(canvas);

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('2D context not supported');
	}

	// Create radial gradient
	const gradient = ctx.createRadialGradient(300, 200, 10, 300, 200, 200);
	gradient.addColorStop(0, '#FF6B6B');
	gradient.addColorStop(0.5, '#4ECDC4');
	gradient.addColorStop(1, '#45B7D1');

	// Fill with gradient
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Take a screenshot
	await expect(page.screenshot()).resolves.toMatchSnapshot('gradient-canvas.png');

	// Cleanup
	document.body.removeChild(canvas);
});

test.skip('WebGL rendering test - simple triangle', async () => {
	// This test demonstrates WebGL rendering, which is relevant for
	// the glugglug 2D engine use case
	const canvas = document.createElement('canvas');
	canvas.width = 800;
	canvas.height = 600;
	canvas.id = 'webgl-canvas';
	document.body.appendChild(canvas);

	const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
	if (!gl) {
		throw new Error('WebGL not supported');
	}

	// Clear to dark gray
	gl.clearColor(0.2, 0.2, 0.2, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Vertex shader
	const vertexShaderSource = `
		attribute vec2 a_position;
		attribute vec3 a_color;
		varying vec3 v_color;
		void main() {
			gl_Position = vec4(a_position, 0.0, 1.0);
			v_color = a_color;
		}
	`;

	// Fragment shader with color varying
	const fragmentShaderSource = `
		precision mediump float;
		varying vec3 v_color;
		void main() {
			gl_FragColor = vec4(v_color, 1.0);
		}
	`;

	// Helper to create shader
	const createShader = (gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, source: string) => {
		const shader = gl.createShader(type);
		if (!shader) throw new Error('Failed to create shader');
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error('Shader compilation failed: ' + info);
		}
		return shader;
	};

	// Create shaders and program
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	const program = gl.createProgram();
	if (!program) throw new Error('Failed to create program');
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error('Program linking failed: ' + info);
	}

	gl.useProgram(program);

	// Triangle vertices with colors (x, y, r, g, b)
	const vertices = new Float32Array([
		// Position (x, y)  // Color (r, g, b)
		0.0,
		0.5,
		1.0,
		0.0,
		0.0, // Top (red)
		-0.5,
		-0.5,
		0.0,
		1.0,
		0.0, // Bottom-left (green)
		0.5,
		-0.5,
		0.0,
		0.0,
		1.0, // Bottom-right (blue)
	]);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	// Setup position attribute (2 floats per vertex, stride of 5 floats)
	const positionLocation = gl.getAttribLocation(program, 'a_position');
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 5 * 4, 0);

	// Setup color attribute (3 floats per vertex, stride of 5 floats, offset by 2 floats)
	const colorLocation = gl.getAttribLocation(program, 'a_color');
	gl.enableVertexAttribArray(colorLocation);
	gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 5 * 4, 2 * 4);

	// Draw the triangle
	gl.drawArrays(gl.TRIANGLES, 0, 3);

	// Take a screenshot
	await expect(page.screenshot()).resolves.toMatchSnapshot('webgl-triangle.png');

	// Cleanup
	document.body.removeChild(canvas);
});
