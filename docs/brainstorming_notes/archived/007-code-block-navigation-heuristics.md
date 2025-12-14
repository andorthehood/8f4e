# Brainstorming: Code Block Navigation Heuristics

**Date**: 2025-02-14  
**Context**: Refining `findClosestCodeBlockInDirection` so directional navigation matches user expectations when blocks are diagonally offset.

## Problem Statement

Current navigation logic compares block centers, so diagonally closer blocks can beat vertically aligned ones. When moving `down`, a slightly lower left block can win over a block directly below, creating confusing jumps.

## Alternative Heuristics

- **Axis-first ranking**  
  Filter by the target direction (e.g. `candidateTop >= selectedBottom` for `down`). Rank primarily by the gap on that axis, then use perpendicular distance only as a tiebreaker.

- **Directional cone**  
  Treat navigation as a vector from the active block, reject candidates whose angle from the desired axis exceeds a narrow cone (≈30°). Among survivors, score by distance.

- **Overlap requirement**  
  Require minimum overlap on the perpendicular axis (percentage of width/height). Gradually relax if no candidates remain to preserve navigation fallback.

- **Edge-based distance (preferred)**  
  Measure from nearest edges instead of centers (selected bottom to candidate top for `down`). Keeps a truly vertical neighbor ahead of diagonally closer blocks and aligns with the desired behavior.

- **Alignment weight tuning**  
  Keep the current formula but greatly increase the perpendicular-distance weight (possibly per-direction) so misalignment is heavily penalized.

## Notes

- Most UI toolkits combine these ideas: strict directional filtering, edge distances, strong alignment bias.
- Whatever heuristic we choose, we should add fixtures covering diagonal layouts so Vitest catches regressions.
