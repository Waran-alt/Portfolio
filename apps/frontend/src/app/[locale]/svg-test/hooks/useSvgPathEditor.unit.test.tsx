import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useSvgPathEditor } from './useSvgPathEditor';

describe('useSvgPathEditor', () => {
  const INITIAL = 'M 100,200 Q 200,100 300,200';

  it('initializes with canonical path and derived state', () => {
    const { result } = renderHook(() => useSvgPathEditor(INITIAL));
    expect(result.current.pathString).toBe(INITIAL);
    expect(result.current.pendingPathString).toBe(INITIAL);
    expect(result.current.isPathClosed).toBe(false);
    expect(result.current.isValid).toBe(true);
  });

  it('validates pending string; on failure keeps pending and marks invalid', () => {
    const { result } = renderHook(() => useSvgPathEditor(INITIAL));
    // Use an invalid command letter so the parser rejects it
    act(() => {
      result.current.setPendingPathString('X 10,10');
      result.current.handleValidate();
    });
    // On error, keep canonical path unchanged and preserve user's pending input
    expect(result.current.pathString).toBe(INITIAL);
    expect(result.current.pendingPathString).toBe('X 10,10');

    // Update pending first, then validate in a separate act to avoid stale closure
    act(() => {
      result.current.setPendingPathString('M 0,0 L 10,10');
    });
    act(() => {
      result.current.handleValidate();
    });
    expect(result.current.isValid).toBe(true);
    // Canonical formatting uses spaces and comma-separated pairs
    expect(result.current.pathString).toBe('M 0,0 L 10,10');
  });

  it('appends a new segment honoring relative/absolute toggle', () => {
    const { result } = renderHook(() => useSvgPathEditor(INITIAL));
    // Default segmentTypeToAppend is 'Q', absolute by default
    act(() => {
      result.current.handleAppendSegment();
    });
    expect(result.current.pathString).toMatch(/ Q /);

    // Toggle relative and append again
    act(() => {
      result.current.setIsRelative(true);
      result.current.handleAppendSegment();
    });
    // The string should grow further
    expect(result.current.pathString.length).toBeGreaterThan(INITIAL.length);
  });

  it('toggles close-path Z based on checkbox state', () => {
    const { result } = renderHook(() => useSvgPathEditor('M 0,0 L 10,10'));
    expect(result.current.isPathClosed).toBe(false);
    act(() => {
      result.current.handleClosePath(true);
    });
    expect(/Z\s*$/i.test(result.current.pathString)).toBe(true);
    expect(result.current.isPathClosed).toBe(true);

    act(() => {
      result.current.handleClosePath(false);
    });
    expect(/Z\s*$/i.test(result.current.pathString)).toBe(false);
    expect(result.current.isPathClosed).toBe(false);
  });

  it('rounds numeric values and regenerates points', () => {
    const { result } = renderHook(() => useSvgPathEditor('M 0.6,0.4 L 10.9,10.1'));
    act(() => {
      result.current.handleRoundValues();
    });
    // Rounded values (canonical format)
    expect(result.current.pathString).toBe('M 1,0 L 11,10');
    expect(result.current.points.length).toBeGreaterThan(0);
  });

  it('regenerates points from a provided path and marks invalid on failure', () => {
    const { result } = renderHook(() => useSvgPathEditor(INITIAL));
    act(() => {
      result.current.regeneratePointsFromPath(INITIAL);
    });
    expect(result.current.points.length).toBeGreaterThan(0);

    act(() => {
      result.current.regeneratePointsFromPath('invalid');
    });
    expect(result.current.points.length).toBe(0);
    expect(result.current.isValid).toBe(false);
  });

  it('rebuilds path from current points via updatePathFromPoints', () => {
    const { result } = renderHook(() => useSvgPathEditor('M 0,0 Q 10,10 20,20'));
    const before = result.current.pathString;
    // Trigger point extraction first
    act(() => {
      result.current.regeneratePointsFromPath(result.current.pathString);
    });
    const pts = result.current.points;
    expect(pts.length).toBeGreaterThan(0);
    // Moving a point
    const target = pts[0]!;
    const newX = target.x + 5;

    // First commit point change, then rebuild in a separate act so the callback captures the updated points state
    act(() => {
      result.current.setPoints((prev) => prev.map((p) => (p.id === target.id ? { ...p, x: newX } : p)));
    });
    act(() => {
      result.current.updatePathFromPoints();
    });
    const after = result.current.pathString;

    expect(after).not.toBe(before);
    // The updated x should be present in the rebuilt path string
    expect(after).toContain(`${newX},`);
  });

  it('keeps relative command casing and uses deltas when updating a said point', () => {
    // Path with a relative quadratic segment at index 2
    const relPath = 'M 100,200 Q 200,100 300,200 q 25,-50 50,0';
    const { result } = renderHook(() => useSvgPathEditor(relPath));

    // Extract points first
    act(() => {
      result.current.regeneratePointsFromPath(result.current.pathString);
    });

    // Move the control point of the relative q segment (index 2) from (325,150) to (330,150)
    // This should change the delta from 25 to 30 while keeping lowercase 'q'
    act(() => {
      result.current.setPoints(prev => prev.map(p => p.id === 'pt-2-q1' ? { ...p, x: 330 } : p));
    });
    act(() => {
      (result.current as any).updatePathFromPointsForPoint('pt-2-q1');
    });

    const out = result.current.pathString;
    expect(out).toMatch(/ q /); // still relative
    expect(out).toContain('q 30,-50 50,0'); // deltas relative to previous endpoint (300,200)
  });
  
  it('keeps relative command intact when updating a different command', () => {
    const relPath = 'M 100,200 Q 200,100 300,200 q 25,-50 50,0';
    const { result } = renderHook(() => useSvgPathEditor(relPath));

    act(() => {
      result.current.regeneratePointsFromPath(result.current.pathString);
    });

    // Move a point from the absolute Q segment (index 1), not the relative q (index 2)
    act(() => {
      result.current.setPoints(prev => prev.map(p => p.id === 'pt-1-q1' ? { ...p, x: 210 } : p));
    });
    act(() => {
      (result.current as any).updatePathFromPointsForPoint('pt-1-q1');
    });

    const out = result.current.pathString;
    // Relative command remains lowercase and deltas unchanged
    expect(out).toMatch(/ q /);
    expect(out).toContain('q 25,-50 50,0');
  });

  it('keeps absolute command casing and uses absolute coords when updating a single point', () => {
    // Absolute quadratic at index 1
    const absPath = 'M 100,200 Q 200,100 300,200 q 25,-50 50,0';
    const { result } = renderHook(() => useSvgPathEditor(absPath));

    act(() => {
      result.current.regeneratePointsFromPath(result.current.pathString);
    });

    // Move control point of absolute Q (index 1) from (200,100) to (210,100)
    act(() => {
      result.current.setPoints(prev => prev.map(p => p.id === 'pt-1-q1' ? { ...p, x: 210 } : p));
    });
    act(() => {
      (result.current as any).updatePathFromPointsForPoint('pt-1-q1');
    });

    const out = result.current.pathString;
    expect(out).toMatch(/ Q /); // still absolute
    expect(out).toContain('Q 210,100 300,200'); // absolute updated, end unchanged
  });
});


