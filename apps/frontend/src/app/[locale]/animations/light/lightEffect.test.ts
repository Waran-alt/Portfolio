import type { LightPosition } from './lightEffect';
import { createLightGradient } from './lightEffect';

describe('Light Effect - createLightGradient', () => {
  it('generates a valid CSS radial-gradient string', () => {
    const position: LightPosition = { x: 500, y: 300 };
    const gradient = createLightGradient(position);
    
    expect(gradient).toContain('radial-gradient');
    expect(gradient).toContain('circle');
  });

  it('includes RGB color values', () => {
    const position: LightPosition = { x: 100, y: 200 };
    const gradient = createLightGradient(position);
    
    expect(gradient).toContain('rgb(');
    expect(gradient).toMatch(/\d+,\s*\d+,\s*\d+/); // Should contain RGB format
  });

  it('includes position percentages based on coordinates', () => {
    const position1: LightPosition = { x: 0, y: 0 };
    const gradient1 = createLightGradient(position1);
    
    const position2: LightPosition = { x: 1920, y: 1080 };
    const gradient2 = createLightGradient(position2);
    
    // Should produce different gradients for different positions
    expect(gradient1).not.toEqual(gradient2);
  });

  it('handles screen center position', () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const position: LightPosition = { x: centerX, y: centerY };
    const gradient = createLightGradient(position);
    
    expect(gradient).toContain('radial-gradient');
    // Should contain percentage values near 50% for center
    expect(gradient).toMatch(/\d+/); // Has numbers
  });

  it('handles edge positions', () => {
    const position1: LightPosition = { x: 0, y: 0 };
    const position2: LightPosition = { x: window.innerWidth, y: 0 };
    const position3: LightPosition = { x: window.innerWidth, y: window.innerHeight };
    const position4: LightPosition = { x: 0, y: window.innerHeight };
    
    expect(() => createLightGradient(position1)).not.toThrow();
    expect(() => createLightGradient(position2)).not.toThrow();
    expect(() => createLightGradient(position3)).not.toThrow();
    expect(() => createLightGradient(position4)).not.toThrow();
  });

  it('produces different gradients for different positions', () => {
    const position1: LightPosition = { x: 100, y: 100 };
    const position2: LightPosition = { x: 500, y: 300 };
    const position3: LightPosition = { x: 900, y: 700 };
    
    const gradient1 = createLightGradient(position1);
    const gradient2 = createLightGradient(position2);
    const gradient3 = createLightGradient(position3);
    
    expect(gradient1).not.toEqual(gradient2);
    expect(gradient2).not.toEqual(gradient3);
    expect(gradient1).not.toEqual(gradient3);
  });

  it('handles extreme coordinate values', () => {
    const position1: LightPosition = { x: -1000, y: -1000 };
    const position2: LightPosition = { x: 10000, y: 10000 };
    
    expect(() => createLightGradient(position1)).not.toThrow();
    expect(() => createLightGradient(position2)).not.toThrow();
  });

  it('produces consistent gradients for same position', () => {
    const position: LightPosition = { x: 640, y: 360 };
    
    const gradient1 = createLightGradient(position);
    const gradient2 = createLightGradient(position);
    
    expect(gradient1).toEqual(gradient2);
  });

  it('includes the correct gradient syntax elements', () => {
    const position: LightPosition = { x: 100, y: 100 };
    const gradient = createLightGradient(position);
    
    // Should contain all required gradient syntax elements
    expect(gradient).toContain('linear-gradient');
    expect(gradient).toContain('radial-gradient');
    
    // Should contain background gradient colors
    const hasMultipleColors = (gradient.match(/rgb\(/g) || []).length > 1;
    expect(hasMultipleColors).toBe(true);
  });

  it('scales position based on window dimensions', () => {
    const { innerWidth, innerHeight } = window;
    const position: LightPosition = { 
      x: innerWidth / 2, 
      y: innerHeight / 2 
    };
    
    const gradient = createLightGradient(position);
    
    // Should produce a gradient with percentages
    expect(gradient).toMatch(/\d+\.?\d*%/);
  });
});

