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

  it('validates pending string and canonicalizes or reverts on failure', () => {
    const { result } = renderHook(() => useSvgPathEditor(INITIAL));
    act(() => {
      result.current.setPendingPathString('invalid path');
      result.current.handleValidate();
    });
    // On error, pending reverts to last valid canonical string and isValid becomes false
    expect(result.current.pendingPathString).toBe(result.current.pathString);
    expect(result.current.isValid).toBe(false);

    act(() => {
      result.current.setPendingPathString('M 0,0 L 10,10');
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
    // Move first available point by setting points and rebuilding
    act(() => {
      result.current.setPoints((prev) => prev.map((p, i) => (i === 0 ? { ...p, x: p.x + 5 } : p)));
      result.current.updatePathFromPoints();
    });
    const after = result.current.pathString;
    expect(after).not.toBe(before);
  });
});


