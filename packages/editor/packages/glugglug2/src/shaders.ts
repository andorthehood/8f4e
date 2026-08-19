export const vertexShaderSource = `#version 300 es
	precision highp float;
	precision highp int;

	layout(location = 0) in vec4 a_rectangle;
	layout(location = 1) in uint a_spriteId;

	uniform vec2 u_resolution;
	uniform vec2 u_atlasSize;
	uniform highp usampler2D u_spriteRectangles;

	out vec2 v_textureCoordinate;

	const vec2 CORNERS[4] = vec2[](
		vec2(0.0, 0.0),
		vec2(1.0, 0.0),
		vec2(0.0, 1.0),
		vec2(1.0, 1.0)
	);

	void main() {
		vec2 corner = CORNERS[gl_VertexID];
		uvec4 spriteRectangle = texelFetch(u_spriteRectangles, ivec2(int(a_spriteId), 0), 0);

		vec2 pixelPosition = a_rectangle.xy + corner * a_rectangle.zw;
		vec2 clipPosition = pixelPosition / u_resolution * 2.0 - 1.0;
		gl_Position = vec4(clipPosition * vec2(1.0, -1.0), 0.0, 1.0);

		vec2 atlasPixel = vec2(spriteRectangle.xy) + corner * vec2(spriteRectangle.zw);
		v_textureCoordinate = atlasPixel / u_atlasSize;
	}
`;

export const fragmentShaderSource = `#version 300 es
	precision mediump float;

	in vec2 v_textureCoordinate;
	uniform sampler2D u_atlas;

	out vec4 outColor;

	void main() {
		outColor = texture(u_atlas, v_textureCoordinate);
	}
`;
