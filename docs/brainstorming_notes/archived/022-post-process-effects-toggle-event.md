# Post-process effects toggle event + key binding plan

## Goal
Add a platform-agnostic way to toggle post-process effects so a broken fragment shader does not obscure the editor.

## State and events (editor-state)
- Add `graphicHelper.postProcessEffectsEnabled: boolean` (default `true`).
- Add a new event: `togglePostProcessEffects`.
- Add an effect that:
  - Toggles `postProcessEffectsEnabled`.
  - Dispatches `loadPostProcessEffects` with either:
    - `state.graphicHelper.postProcessEffects` when enabled, or
    - `[]` when disabled.

## Key binding (outside editor-state)
Keep key mapping out of editor-state. Two options:

### Option 1: Expose event dispatch on the editor API
- Expose `dispatch` (or `events`) on the editor instance.
- The host app binds keys (e.g. `F9`) and dispatches `togglePostProcessEffects`.

### Option 2: Add editor init key bindings
- Add `options.keyBindings` to editor init.
- Editor handles window keydown and dispatches `togglePostProcessEffects` when a configured key is pressed.

Recommendation: Option 1 for maximum decoupling.
