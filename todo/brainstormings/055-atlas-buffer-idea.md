Current Caching (what’s implemented)

- Per‑group FBOs: Each cacheGroup(id,w,h) creates a dedicated WebGLTexture + WebGLFramebuffer pair per
ID; stored in cacheMap/cacheFramebuffers with size metadata and LRU eviction.
- Capture Path: Flush main buffers, bind the group’s FBO, viewport(0,0,w,h), set u_resolution to (w,h),
clear to transparent, draw, then restore default framebuffer and uniforms.
- Playback Path: drawCachedTexture(tex,w,h,x,y) appends a quad with UVs [0..1] (V flipped to match FBO
orientation). A “segment” system preserves draw order between sprite‑sheet content and cached quads by
rebinding textures per segment.
- Post‑process: Whole frame renders into a single off‑screen renderTexture then runs effects. Cache
drawing integrates before this, so post‑process remains unchanged.
- Eviction: Simple LRU on cache IDs; deleting each cache’s texture + framebuffer when exceeding
maxCacheItems.

Single-Atlas Buffer (what you’re proposing)

- One/Few FBO Pages: Allocate one large texture (atlas) attached to a single FBO. Each cacheGroup
receives a rectangle in this atlas instead of its own FBO.
- Subrect Rendering: For capture, set viewport(x,y,w,h) to the atlas subrect, enable scissor(x,y,w,h),
clear only that region, set u_resolution=(w,h), draw.
- Playback UVs: Store per‑cache UVs that map to the subrect; drawCachedTexture uses those UVs instead
of [0..1]. All cached quads can bind the same atlas texture, reducing texture binds.

Benefits

- Fewer binds/draw calls: Cached draws share one atlas texture, collapsing many segments (from
“spritesheet + N cache textures” down to “spritesheet + atlas”).
- Lower GL object churn: Drastically reduces the number of textures/framebuffers created, bound, and
deleted.
- Better cache density: Many small cached snapshots waste less memory than many standalone textures
with padding.

Complexities/Risks

- Packing algorithm: Need a rectangle packer (Skyline/Shelf/Guillotine/MaxRects) with a free‑list and
simple LRU reclamation. Fragmentation management required.
- Bleeding control: With LINEAR filtering, add 1–2 px gutter around each rect and inset UVs (e.g.,
half‑texel bias) to avoid sampling neighbors.
- Clear granularity: gl.clear affects whole framebuffer; must use scissor to clear only the target
rect; remember to disable/restore it.
- Atlas limits: Constrained by max texture size (e.g., 4096/8192). Large caches may force multiple
pages; still far fewer than per‑cache textures.
- Repacking/migration: If you ever want compaction, you’d need to re‑render cache entries into new
positions; avoid at first by using pages and simple free‑lists.

Feasibility

- WebGL1‑friendly: Works with current setup (no texture arrays needed). Current shaders already rely on
u_resolution; viewport offsets make subrect rendering straightforward.
- Minimal API churn: External APIs (cacheGroup, drawCachedContent) remain the same; changes are
internal to CachedRenderer.

Suggested Path

- Phase 1 (safe gains):
    - Implement a simple atlas manager with a single configurable page (e.g., 2048×2048), Skyline/Shelf
packing, 1px gutter, and scissor clears.
    - Change CachedRenderer to allocate atlas rects per cacheId; store UVs; modify drawCachedTexture to
use rect UVs.
    - Keep LRU; when evicting, free the rect; if allocation fails, add a second page (list of atlas
pages).
- Phase 2 (polish):
    - Stats + diagnostics (utilization, fragmentation).
    - Optional background recache to a fresh page when fragmentation is high.
    - Tests for packing, scissor clearing, UV correctness, and LRU reuse.

Bottom line: Yes, moving to a single (or few) atlas framebuffer(s) makes sense and should reduce
texture binds, draw calls, and GL resource pressure, especially when many cached groups are used. Want
me to sketch the AtlasManager interface and the CachedRenderer deltas next, or prototype a minimal
single‑page atlas to compare binds/draws?