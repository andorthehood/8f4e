export default `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float u_time;

void main() {
    vec2 uv = v_texcoord;
    vec4 color = texture2D(u_texture, uv);
    gl_FragColor = color;
}
`;
