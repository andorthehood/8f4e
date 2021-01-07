precision mediump float;

varying vec2 v_texcoord;

uniform vec4 u_color;
uniform sampler2D u_texture;
uniform bool u_draw_texture;

void main() {
    if (u_draw_texture) {
        gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    else {
	    gl_FragColor = u_color;
    }
}