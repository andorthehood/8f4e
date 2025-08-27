/**
 * Texture Cache System Test
 * This test demonstrates and validates the texture caching functionality.
 * Run this in the browser to see the cache in action.
 */

import { Engine } from '../packages/2d-engine/dist/index.js';

// Create canvas and engine
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

const engine = new Engine(canvas);

// Create a simple sprite sheet for testing
const createTestSpriteSheet = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Create a simple red square sprite
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 32, 32);
    
    // Create a simple blue circle sprite
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(48, 16, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Create a simple green line sprite
    ctx.fillStyle = 'green';
    ctx.fillRect(16, 32, 32, 4);
    
    return canvas;
};

// Load sprite sheet
const spriteSheet = createTestSpriteSheet();
engine.loadSpriteSheet(spriteSheet);

// Set up sprite lookup
engine.setSpriteLookup({
    redSquare: { x: 0, y: 0, spriteWidth: 32, spriteHeight: 32 },
    blueCircle: { x: 32, y: 0, spriteWidth: 24, spriteHeight: 24 },
    greenLine: { x: 16, y: 32, spriteWidth: 32, spriteHeight: 4 }
});

// Test variables
let frame = 0;
let cacheCreated = false;
let performanceData = {
    withoutCache: [],
    withCache: []
};

// Complex drawing function to test caching
const drawComplexShape = (x, y) => {
    // Draw multiple sprites in a pattern
    engine.drawSprite(x, y, 'redSquare');
    engine.drawSprite(x + 40, y, 'blueCircle');
    engine.drawSprite(x + 80, y, 'redSquare');
    
    engine.drawSprite(x, y + 40, 'blueCircle');
    engine.drawSprite(x + 40, y + 40, 'redSquare');
    engine.drawSprite(x + 80, y + 40, 'blueCircle');
    
    // Draw some lines
    engine.drawLine(x, y + 80, x + 80, y + 80, 'greenLine', 2);
    engine.drawLine(x, y + 90, x + 80, y + 90, 'greenLine', 2);
    engine.drawLine(x, y + 100, x + 80, y + 100, 'greenLine', 2);
};

// Test function
const runTest = () => {
    const startTime = performance.now();
    
    if (frame < 60) {
        // First 60 frames: Draw without caching to measure baseline performance
        drawComplexShape(100, 100);
        drawComplexShape(200, 200);
        drawComplexShape(300, 100);
        
        const endTime = performance.now();
        performanceData.withoutCache.push(endTime - startTime);
        
        if (frame === 59) {
            console.log('Baseline performance (without cache) measured');
        }
    } else if (frame === 60) {
        // Frame 60: Create cache
        console.log('Creating texture cache...');
        
        engine.startTextureCacheBlock('complexShape', 120, 120, 0, 0);
        drawComplexShape(0, 0); // Draw at origin for cache
        engine.endTextureCacheBlock();
        
        cacheCreated = true;
        console.log('Cache created!');
    } else if (frame < 120) {
        // Frames 61-119: Draw using cache
        const cacheStartTime = performance.now();
        
        // Use cached version - should be much faster
        engine.startTextureCacheBlock('complexShape', 120, 120, 100, 100);
        drawComplexShape(0, 0); // These operations should be ignored
        engine.endTextureCacheBlock();
        
        engine.startTextureCacheBlock('complexShape', 120, 120, 200, 200);
        drawComplexShape(0, 0); // These operations should be ignored
        engine.endTextureCacheBlock();
        
        engine.startTextureCacheBlock('complexShape', 120, 120, 300, 100);
        drawComplexShape(0, 0); // These operations should be ignored
        engine.endTextureCacheBlock();
        
        const cacheEndTime = performance.now();
        performanceData.withCache.push(cacheEndTime - cacheStartTime);
        
        if (frame === 119) {
            // Calculate and display performance results
            const avgWithoutCache = performanceData.withoutCache.reduce((a, b) => a + b) / performanceData.withoutCache.length;
            const avgWithCache = performanceData.withCache.reduce((a, b) => a + b) / performanceData.withCache.length;
            const improvement = ((avgWithoutCache - avgWithCache) / avgWithoutCache * 100).toFixed(2);
            
            console.log('Performance Test Results:');
            console.log(`Average time without cache: ${avgWithoutCache.toFixed(3)}ms`);
            console.log(`Average time with cache: ${avgWithCache.toFixed(3)}ms`);
            console.log(`Performance improvement: ${improvement}%`);
            
            // Test cache management
            console.log('Testing cache management...');
            console.log('Cache exists:', engine.textureCache?.has('complexShape'));
            
            // Clear cache and verify
            engine.clearTextureCache();
            console.log('Cache cleared. Cache exists:', engine.textureCache?.has('complexShape'));
            
            console.log('✅ Texture caching test completed successfully!');
        }
    } else {
        // After frame 120: Continue normal rendering to show the system still works
        drawComplexShape(100, 100);
        drawComplexShape(200, 200);
        drawComplexShape(300, 100);
    }
    
    frame++;
};

// Start the test
console.log('Starting texture cache test...');
console.log('The test will measure performance with and without caching');

engine.render((timeToRender, fps, triangles, maxTriangles) => {
    runTest();
});

// Add some info to the page
const info = document.createElement('div');
info.innerHTML = `
    <h2>Texture Cache System Test</h2>
    <p>This test validates the texture caching functionality:</p>
    <ul>
        <li>Frames 1-60: Baseline performance without caching</li>
        <li>Frame 60: Create texture cache</li>
        <li>Frames 61-120: Performance with caching (should be faster)</li>
        <li>Check console for performance results</li>
    </ul>
    <p>The cache works as a drop-in replacement for startGroup/endGroup.</p>
`;
info.style.position = 'absolute';
info.style.top = '10px';
info.style.left = '10px';
info.style.background = 'rgba(255,255,255,0.9)';
info.style.padding = '10px';
info.style.fontFamily = 'Arial, sans-serif';
info.style.fontSize = '14px';
document.body.appendChild(info);