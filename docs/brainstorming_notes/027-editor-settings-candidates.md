---
title: 'Editor Settings Candidates (Discussion)'
priority: Low
effort: 0.5h
created: 2026-01-23
status: Draft
---

# Editor Settings Candidates (Discussion)

## Goal
Track editor-level settings we discussed as candidates for the editor config (not project config).

## Settings Considered
- Viewport animation duration (`viewport.animationDurationMs`).
- History stack length (max entries for undo/redo; currently hardcoded to 10).
- Compilation debounce duration (currently 500ms).
- Vertex buffer size (max sprites; currently `growBuffer(20000)` in glugglug renderer).
- Texture cache size (max cache items; `maxCacheItems`, default 50 in glugglug).
- Position offsetter toggle key (currently hardcoded to `F10`).
- Info overlay toggle (show FPS/triangles/etc. in web UI).
- Info overlay toggle keybinding (function key, configurable).
- Info overlay default visibility (on/off).
- Console/log overlay toggle (show internal logs in web UI).
- Console/log overlay toggle keybinding (function key, configurable).
- Console/log overlay default visibility (on/off).
- Mute toggle keybinding (global audio output mute).
- Program start/stop keybinding (toggle runtime execution).
- Auto-compilation toggle (enable/disable auto compile).
- Force compile keybinding (manual compile trigger).

## Notes
- These should live in editor settings (editor config blocks / compiled editor config), not project config.
- Vertex buffer size and texture cache size likely flow through `glugglug` Engine options.
- Toggle key should become a configurable key binding instead of a fixed key.
