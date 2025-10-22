// This file is used to set up the Jest test environment.
// For example, it can be used to import global libraries like @testing-library/jest-dom.

import '@testing-library/jest-dom';
import { URL as NodeURL } from 'node:url';

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

// Provide a minimal mock for next/server when running in JSDOM to avoid ReferenceError: Request
try {
  // If next/server can be resolved, provide minimal shims for Request usage paths
  // Only define globals if they don't exist
  if (typeof global.Request === 'undefined') {
    // Very small stub sufficient for NextRequest constructor usage in tests
    global.Request = class RequestStub {
      constructor(input, init) {
        const derivedUrl = typeof input === 'string' ? input : (input?.url ?? 'http://localhost/');
        this._url = derivedUrl;
        this.headers = new Headers(init?.headers || {});
        this.method = init?.method || 'GET';
      }
      get url() {
        return this._url;
      }
    };
  }
  if (typeof global.Headers === 'undefined') {
    global.Headers = class HeadersStub {
      constructor(init) {
        this.map = new Map(Object.entries(init || {}));
      }
      get(key) { return this.map.get(key.toLowerCase()) || null; }
      set(key, value) { this.map.set(key.toLowerCase(), String(value)); }
      has(key) { return this.map.has(key.toLowerCase()); }
    };
  }
  if (typeof global.URL === 'undefined') {
    global.URL = NodeURL;
  }
} catch (_) {
  // ignore if resolution fails; tests that don't touch next/server will still run
}

// Polyfill minimal Web Fetch API pieces if missing in the JSDOM environment
if (typeof global.Headers === 'undefined') {
  global.Headers = class HeadersStub {
    constructor(init) {
      this.map = new Map(Object.entries(init || {}));
    }
    get(key) { return this.map.get(String(key).toLowerCase()) || null; }
    set(key, value) { this.map.set(String(key).toLowerCase(), String(value)); }
    has(key) { return this.map.has(String(key).toLowerCase()); }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class ResponseStub {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Headers(init.headers || {});
    }
    json() { return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body || 'null') : this.body); }
    text() { return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body || null)); }
  };
}

if (typeof global.fetch === 'undefined') {
  global.fetch = async function fetchStub() {
    return new Response(null, { status: 200 });
  };
}
