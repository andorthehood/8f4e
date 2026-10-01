---
title: Agent Success Note - Resolved sprite identifiers before the render hot path
agent: Codex Version 26.924.22138
model: GPT-5.6
date: 2026-10-01
---

# Agent Success Note - Resolved Sprite Identifiers Before the Render Hot Path

## Short Summary

The agent reduced per-sprite CPU work by moving public identifier normalization and map lookup from `drawSprite()` to
atlas setup. Drawing now receives an atlas-specific dense id and indexes packed metadata directly, while atlas
replacement rebuilds the editor's resolved lookup tables before rendering resumes.

## Original Request

TODO 482 proposed resolving public sprite identifiers before drawing. The existing renderer converted every string or
numeric identifier with `String(identifier)`, performed a `Map.get(...)`, read the resolved sprite record, and then
appended the instance data. The editor already knew each sprite's semantic role before entering the render loop, so that
resolution work was repeated for every glyph and UI sprite in every frame.

## Verification and Design Choice

The agent traced atlas creation, renderer submission, sprite-generator output, editor initialization, and atlas reloads
before changing the API. This established two important constraints:

- A public numeric lookup key is not necessarily its dense atlas index, so sparse numbers must be resolved just like
  names.
- Dense ids belong to one installed atlas, so replacing the atlas must rebuild every retained semantic lookup table.

The implementation therefore made `Engine.setSpriteAtlas()` return a cold-path resolver. The sprite generator retains
public identifiers and provides a helper that converts its grouped semantic tables into branded dense `SpriteId` values.
`drawSprite()` accepts only those resolved ids and performs no string conversion or map lookup.

## Runtime Result

Per-sprite submission now consists of a dense metadata offset calculation, optional default-dimension reads, and the
existing instance-buffer append. GPU uploads, draw calls, instance size, sprite order, and rendering behavior are
unchanged.

A retained headless-Chrome microbenchmark produced byte-identical instance data and measured:

| Sprites per frame | Map and string lookup | Dense metadata lookup | Reduction |
| ----------------- | --------------------- | --------------------- | --------- |
| 10,000 | 0.096 ms | 0.020 ms | 79.2% |
| 100,000 | 1.320 ms | 0.400 ms | 69.7% |

These figures isolate CPU submission work; they are not whole-frame speedups.

## Success Pattern

Move stable semantic resolution to the lifecycle boundary where the relevant resource is installed, then make the hot
path consume a representation that already matches its storage layout. Preserve correctness by tying the resolved value
to that resource's lifetime and rebuilding dependent tables when the resource changes.

## Reusable Principle

When optimizing a repeated path, first separate public identity from internal indexing. Do not assume externally visible
numbers are already dense indices, and do not add per-call generation checks to compensate for unclear ownership.
Resolve once at setup, encode the invariant in types, update replacement paths, and benchmark equivalent output rather
than timing a simplified operation with different behavior.
