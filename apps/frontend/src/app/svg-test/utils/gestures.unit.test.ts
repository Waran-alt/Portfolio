import {
  analyzePanGesture,
  calculateAngle,
  calculateAverageVelocity,
  calculateDistance,
  calculateInertiaDecay,
  calculateVelocity,
  debounceGesture,
  detectMultiTouchGesture,
  determineDirection,
  throttleGesture,
  type TimestampedPointerEvent
} from './gestures';

describe('Gestures Unit', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      
      const distance = calculateDistance(point1, point2);
      
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should calculate distance for negative coordinates', () => {
      const point1 = { x: -1, y: -2 };
      const point2 = { x: 2, y: 1 };
      
      const distance = calculateDistance(point1, point2);
      
      expect(distance).toBeCloseTo(4.24, 2); // sqrt(3² + 3²) = sqrt(18) ≈ 4.24
    });

    it('should return 0 for same points', () => {
      const point = { x: 10, y: 20 };
      
      const distance = calculateDistance(point, point);
      
      expect(distance).toBe(0);
    });
  });

  describe('calculateAngle', () => {
    it('should calculate angle between two points', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 1, y: 1 };
      
      const angle = calculateAngle(point1, point2);
      
      expect(angle).toBe(Math.PI / 4); // 45 degrees
    });

    it('should calculate angle for horizontal line', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 1, y: 0 };
      
      const angle = calculateAngle(point1, point2);
      
      expect(angle).toBe(0);
    });

    it('should calculate angle for vertical line', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 0, y: 1 };
      
      const angle = calculateAngle(point1, point2);
      
      expect(angle).toBe(Math.PI / 2); // 90 degrees
    });
  });

  describe('determineDirection', () => {
    it('should determine horizontal direction', () => {
      const startPoint = { x: 0, y: 0 };
      const endPoint = { x: 100, y: 10 };
      
      const direction = determineDirection(startPoint, endPoint);
      
      expect(direction).toBe('horizontal');
    });

    it('should determine vertical direction', () => {
      const startPoint = { x: 0, y: 0 };
      const endPoint = { x: 10, y: 100 };
      
      const direction = determineDirection(startPoint, endPoint);
      
      expect(direction).toBe('vertical');
    });

    it('should determine diagonal direction', () => {
      const startPoint = { x: 0, y: 0 };
      const endPoint = { x: 50, y: 50 };
      
      const direction = determineDirection(startPoint, endPoint);
      
      expect(direction).toBe('diagonal');
    });
  });

  describe('calculateVelocity', () => {
    it('should calculate velocity from events', () => {
      const now = Date.now();
      const events: TimestampedPointerEvent[] = [
        { x: 0, y: 0, timestamp: now },
        { x: 100, y: 50, timestamp: now + 100 }
      ];
      
      const velocity = calculateVelocity(events);
      
      expect(velocity.x).toBe(1); // 100px / 100ms
      expect(velocity.y).toBe(0.5); // 50px / 100ms
    });

    it('should return zero velocity for insufficient events', () => {
      const events: TimestampedPointerEvent[] = [
        { x: 0, y: 0, timestamp: Date.now() }
      ];
      
      const velocity = calculateVelocity(events);
      
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should handle zero time delta', () => {
      const now = Date.now();
      const events: TimestampedPointerEvent[] = [
        { x: 0, y: 0, timestamp: now },
        { x: 100, y: 50, timestamp: now }
      ];
      
      const velocity = calculateVelocity(events);
      
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });
  });

  describe('calculateAverageVelocity', () => {
    it('should calculate average velocity', () => {
      const velocities = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 }
      ];
      
      const average = calculateAverageVelocity(velocities);
      
      expect(average.x).toBe(3); // (1 + 3 + 5) / 3
      expect(average.y).toBe(4); // (2 + 4 + 6) / 3
    });

    it('should return zero for empty array', () => {
      const average = calculateAverageVelocity([]);
      
      expect(average.x).toBe(0);
      expect(average.y).toBe(0);
    });
  });

  describe('analyzePanGesture', () => {
    it('should analyze valid pan gesture', () => {
      const now = Date.now();
      const events: TimestampedPointerEvent[] = [
        { x: 0, y: 0, timestamp: now },
        { x: 100, y: 50, timestamp: now + 100 }
      ];
      
      const analysis = analyzePanGesture(events);
      
      expect(analysis.isValid).toBe(true);
      expect(analysis.gesture).toBeDefined();
      expect(analysis.gesture?.distance).toBeGreaterThan(0);
      expect(analysis.gesture?.duration).toBe(100);
    });

    it('should reject gesture with insufficient events', () => {
      const events: TimestampedPointerEvent[] = [
        { x: 0, y: 0, timestamp: Date.now() }
      ];
      
      const analysis = analyzePanGesture(events);
      
      expect(analysis.isValid).toBe(false);
      expect(analysis.reason).toBe('Insufficient events');
    });

    it('should reject gesture with too small distance', () => {
      const now = Date.now();
      const events: TimestampedPointerEvent[] = [
        { x: 0, y: 0, timestamp: now },
        { x: 1, y: 1, timestamp: now + 100 }
      ];
      
      const analysis = analyzePanGesture(events, { minDistance: 10 });
      
      expect(analysis.isValid).toBe(false);
      expect(analysis.reason).toContain('Distance too small');
    });

    it('should reject gesture with too short duration', () => {
      const now = Date.now();
      const events: TimestampedPointerEvent[] = [
        { x: 0, y: 0, timestamp: now },
        { x: 100, y: 100, timestamp: now + 10 }
      ];
      
      const analysis = analyzePanGesture(events, { minDuration: 100 });
      
      expect(analysis.isValid).toBe(false);
      expect(analysis.reason).toContain('Duration too short');
    });
  });

  describe('calculateInertiaDecay', () => {
    it('should calculate inertia decay', () => {
      const initialVelocity = { x: 10, y: 5 };
      
      const steps = calculateInertiaDecay(initialVelocity, 0.9, 10);
      
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]?.step).toBe(0);
      // First step should be position after first friction application
      // initialVelocity * friction = {10, 5} * 0.9 = {9, 4.5}
      expect(steps[0]?.x).toBe(9);
      expect(steps[0]?.y).toBe(4.5);
    });

    it('should stop when velocity becomes very small', () => {
      const initialVelocity = { x: 0.1, y: 0.1 };
      
      const steps = calculateInertiaDecay(initialVelocity, 0.5, 50);
      
      expect(steps.length).toBeLessThan(50);
    });
  });

  describe('detectMultiTouchGesture', () => {
    it('should detect pinch gesture', () => {
      const now = Date.now();
      const events = [
        {
          pointers: [
            { x: 0, y: 0, timestamp: now },
            { x: 100, y: 0, timestamp: now }
          ],
          timestamp: now
        },
        {
          pointers: [
            { x: 0, y: 0, timestamp: now + 100 },
            { x: 200, y: 0, timestamp: now + 100 }
          ],
          timestamp: now + 100
        }
      ];
      
      const gesture = detectMultiTouchGesture(events);
      
      expect(gesture.type).toBe('pinch');
      expect(gesture.scale).toBe(2); // Distance doubled
    });

    it('should detect rotate gesture', () => {
      const now = Date.now();
      const events = [
        {
          pointers: [
            { x: 0, y: 0, timestamp: now },
            { x: 100, y: 0, timestamp: now }
          ],
          timestamp: now
        },
        {
          pointers: [
            { x: 0, y: 0, timestamp: now + 100 },
            { x: 0, y: 100, timestamp: now + 100 }
          ],
          timestamp: now + 100
        }
      ];
      
      const gesture = detectMultiTouchGesture(events);
      
      expect(gesture.type).toBe('rotate');
      expect(gesture.rotation).toBeDefined();
    });

    it('should return none for insufficient events', () => {
      const events = [
        {
          pointers: [{ x: 0, y: 0, timestamp: Date.now() }],
          timestamp: Date.now()
        }
      ];
      
      const gesture = detectMultiTouchGesture(events);
      
      expect(gesture.type).toBe('none');
    });
  });

  describe('debounceGesture', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const originalFunc = () => { callCount++; };
      const debouncedFunc = debounceGesture(originalFunc, 50);
      
      // Call multiple times rapidly
      debouncedFunc();
      debouncedFunc();
      debouncedFunc();
      
      expect(callCount).toBe(0);
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });
  });

  describe('throttleGesture', () => {
    it('should throttle function calls', () => {
      let callCount = 0;
      const originalFunc = () => { callCount++; };
      const throttledFunc = throttleGesture(originalFunc, 50);
      
      // Call multiple times rapidly
      throttledFunc();
      throttledFunc();
      throttledFunc();
      
      expect(callCount).toBe(1); // First call should execute immediately
      
      // Test that throttling works by calling again after a delay
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          throttledFunc();
          expect(callCount).toBe(2); // Should allow one more call after delay
          resolve();
        }, 60);
      });
    });
  });
});
