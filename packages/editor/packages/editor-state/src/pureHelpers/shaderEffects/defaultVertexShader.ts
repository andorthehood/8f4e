/**
 * Default fullscreen-quad vertex shader for post-process effects.
 * This shader is automatically used when a fragment shader is defined without a matching vertex shader.
 * It creates a fullscreen quad and passes normalized screen coordinates to the fragment shader.
 */
export const DEFAULT_VERTEX_SHADER = `precision mediump float;

attribute vec2 a_position;

varying vec2 v_screenCoord;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_screenCoord = (a_position + 1.0) / 2.0;
}`;
