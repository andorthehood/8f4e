// Export types
export type { SpriteCoordinates, SpriteLookup } from './types';
export type { PostProcessEffect, PostProcessPipeline, EffectUniforms, UniformBufferMapping } from './types/postProcess';

// Export main Engine class (public API)
export { Engine } from './engine';

// Export Renderer for advanced users who want low-level access
export { Renderer } from './renderer';

// Export post-processing system
export { PostProcessManager } from './postProcess/PostProcessManager';
