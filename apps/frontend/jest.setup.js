// This file is used to set up the Jest test environment.
// For example, it can be used to import global libraries like @testing-library/jest-dom.

import '@testing-library/jest-dom';

// Mocking browser APIs that are not available in JSDOM
// This is necessary for components that interact with SVG geometry.
if (typeof window !== 'undefined') {
  window.SVGElement.prototype.getScreenCTM = function () {
    return {
      a: 1, d: 1, e: 0, f: 0,
      inverse: function() {
        return {
          a: 1, d: 1, e: 0, f: 0,
        };
      }
    };
  };
  
  window.SVGElement.prototype.createSVGPoint = function () {
    const point = { x: 0, y: 0, matrixTransform: jest.fn() };
    point.matrixTransform = jest.fn().mockReturnValue(point);
    return point;
  };
}
