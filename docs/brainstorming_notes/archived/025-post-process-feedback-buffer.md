# Post-process feedback buffer (motion blur / trails)

## Goal
Enable motion blur and temporal effects by persisting a previous-frame texture and exposing it to shaders in a general, minimal way.

## Decisions and reasoning
- Move to WebGL2 and use MRT so a single post-process pass can output both screen color and an auxiliary buffer.
- Remove multi-effect chaining to keep the pipeline simple and to make MRT integration straightforward.
- Drop shader block IDs and use the first shader blocks only, since there is now a single post-process effect.
- Keep the API minimal: shaders opt in by using the auxiliary output/texture; no extra effect config needed.

## Proposed pipeline
1) Render sprites into `renderTexture`.
2) Run a single post-process pass using MRT:
   - Output 0: screen color
   - Output 1: auxiliary buffer (used for feedback/history or other uses)
3) Persist the auxiliary buffer across frames using a ping-pong pair.
4) Seed the auxiliary buffer on first use by copying `renderTexture`.

## Shader contract (WebGL2)
- Inputs:
  - `u_renderTexture` (current frame)
  - `u_auxTexture0` (previous auxiliary buffer)
- Outputs:
  - `layout(location = 0) out vec4 outColor;`
  - `layout(location = 1) out vec4 outAux;`

Example fragment shader:

```glsl
#version 300 es
precision mediump float;

in vec2 v_screenCoord;
uniform sampler2D u_renderTexture;
uniform sampler2D u_auxTexture0;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outAux;

void main() {
  vec3 current = texture(u_renderTexture, v_screenCoord).rgb;
  vec3 history = texture(u_auxTexture0, v_screenCoord).rgb;
  vec3 color = current + history * 0.94;

  outColor = vec4(color, 1.0);
  outAux = vec4(color, 1.0);
}
```

## Shader block rules (no IDs)
- `fragmentShader` ... `fragmentShaderEnd` is required.
- `vertexShader` ... `vertexShaderEnd` is optional.
- Use the first fragment block found.
- Use the first vertex block if present; otherwise inject the default fullscreen-quad vertex shader.

## Risks / considerations
- MRT requires WebGL2 and increases VRAM usage (extra color attachment + ping-pong).
- Dropping multi-effect chaining and shader IDs is a breaking change.
- Auxiliary buffer seeding must be deterministic to avoid a black flash on first frame.

## Testing
- Add a minimal effect test that validates MRT outputs and aux ping-pong swap.
- Manual smoke test: motion-blur trail example driven by `u_auxTexture0`.
