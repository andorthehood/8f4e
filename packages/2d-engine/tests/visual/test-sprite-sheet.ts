/**
 * Creates a simple test sprite sheet programmatically
 * This avoids needing external image files and ensures consistent test data
 */
export function createTestSpriteSheet(): { canvas: HTMLCanvasElement; spriteLookup: any } {
    // Create a 64x64 canvas with 4 16x16 sprites in a 4x1 layout
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 16;
    
    const ctx = canvas.getContext('2d')!;
    
    // Clear to transparent
    ctx.clearRect(0, 0, 64, 16);
    
    // Sprite 1: Red square (0,0)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 16, 16);
    
    // Sprite 2: Green circle (16,0)
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(24, 8, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sprite 3: Blue triangle (32,0)
    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.moveTo(40, 2);
    ctx.lineTo(34, 14);
    ctx.lineTo(46, 14);
    ctx.closePath();
    ctx.fill();
    
    // Sprite 4: Yellow line (48,0)
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(52, 4);
    ctx.lineTo(60, 12);
    ctx.stroke();
    
    // Create sprite lookup
    const spriteLookup = {
        'red-square': { x: 0, y: 0, spriteWidth: 16, spriteHeight: 16 },
        'green-circle': { x: 16, y: 0, spriteWidth: 16, spriteHeight: 16 },
        'blue-triangle': { x: 32, y: 0, spriteWidth: 16, spriteHeight: 16 },
        'yellow-line': { x: 48, y: 0, spriteWidth: 16, spriteHeight: 16 },
        // Character sprites for text testing
        'A': { x: 0, y: 0, spriteWidth: 16, spriteHeight: 16 }, // Reuse red square for simplicity
        'B': { x: 16, y: 0, spriteWidth: 16, spriteHeight: 16 }, // Reuse green circle
        ' ': { x: 32, y: 0, spriteWidth: 16, spriteHeight: 16 }, // Space character (blue triangle)
    };
    
    return { canvas, spriteLookup };
}

// Mock test to make Jest happy
describe('Test Sprite Sheet Utilities', () => {
    it('should export sprite sheet creation function', () => {
        expect(typeof createTestSpriteSheet).toBe('function');
    });
});