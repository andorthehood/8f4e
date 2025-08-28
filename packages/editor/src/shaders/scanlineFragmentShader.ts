export default `
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
`;
