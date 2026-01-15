# Post-process feedback buffer (motion blur / trails)

## Goal
Add a reusable, generic feedback mechanism to the post-process pipeline so shaders can sample the previous frame and accumulate effects like motion blur, trails, and temporal filters.

## Summary
Introduce an optional feedback buffer per post-process effect. When enabled, the effect receives a new standard uniform (`u_feedbackTexture`) that contains the previous feedback output. Each frame renders into a ping-pong feedback texture, then swaps it for the next frame. Effects without feedback continue to render as they do today.

## Proposed API
- Extend `PostProcessEffect` with an optional `feedback` descriptor:
  - `enabled: boolean`
  - `output?: 'feedback' | 'screen'` (default: `feedback`)
- Standard uniforms:
  - `u_renderTexture` (current frame or previous effect output)
  - `u_feedbackTexture` (previous feedback output, if enabled)

## Renderer/PostProcess changes
1) Allocate a ping-pong texture + FBO pair per feedback-enabled effect.
2) On resize, reallocate feedback textures to match the canvas/render target size.
3) During `render`:
   - Bind `u_renderTexture` to the current pipeline input.
   - Bind `u_feedbackTexture` to the effect's feedback front texture.
   - Render into:
     - feedback back texture if `output === 'feedback'`
     - screen/pipeline target if `output === 'screen'`
   - Swap feedback front/back for the next frame.
   - On first use, seed feedback by copying `u_renderTexture` into the feedback buffer.
4) Final display:
   - If the last enabled effect renders to feedback, present the feedback front texture to the screen.

## Shader contract
Example fragment shader usage:

```glsl
uniform sampler2D u_renderTexture;
uniform sampler2D u_feedbackTexture;
uniform float u_decay;

void main() {
  vec3 current = texture2D(u_renderTexture, v_screenCoord).rgb;
  vec3 history = texture2D(u_feedbackTexture, v_screenCoord).rgb;
  vec3 color = current + history * u_decay;
  gl_FragColor = vec4(color, 1.0);
}
```

## Example effect: motion blur trail
- Persistence is shader-controlled (uniform or constant) without any extra engine API.
- If needed, clamp color to avoid runaway brightness.

## Risks / questions
- Performance: per-effect feedback doubles texture/FBO count.
- Ordering: clarify how feedback effects compose with non-feedback effects.
- Initialization: seed feedback from the current frame on first use; consider a reset hook if needed.
- WebGL1 vs WebGL2 compatibility (texture formats, filtering).
- Shader output: in WebGL1 the fragment shader only writes to the bound framebuffer, so the engine must bind the aux framebuffer to capture feedback.

## Testing
- Add a minimal effect test that exercises feedback swap logic.
- Manual smoke test: a motion-blur trail example project that toggles decay.
