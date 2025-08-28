export default `
precision mediump float;

attribute vec2 a_position;

varying vec2 v_screenCoord;

void main() {
	gl_Position = vec4(a_position, 0, 1);
	v_screenCoord = (a_position + 1.0) / 2.0;
}
`;
