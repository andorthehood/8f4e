export default `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float u_time;

void main() {
    vec2 uv = v_texcoord;
    vec4 color = texture2D(u_texture, uv);
    float glitch = sin(u_time * 10.0 + uv.y * 30.0) * 0.2;
    color.r += glitch;
    color.g += glitch * 0.5;
    color.b += glitch * 0.1;
    gl_FragColor = color;
}
`;
